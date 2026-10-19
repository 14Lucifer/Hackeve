import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import Busboy from 'busboy';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireParticipant } from '@/lib/auth';
import { commitTempUpload, createTempUploadPath, removeFile, removeTempUpload } from '@/lib/storage';
import { LIMITS, ACCEPT, ACCEPT_EXTENSIONS } from '@/lib/util';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ParsedUpload = {
  kind: string;
  originalName: string;
  mimeType: string;
  size: number;
  tempPath: string;
  truncated: boolean;
};

async function parseUpload(req: Request, submissionId: string): Promise<ParsedUpload> {
  if (!req.body) throw new Error('No upload body.');

  return new Promise((resolve, reject) => {
    let kind = '';
    let upload: ParsedUpload | null = null;
    let writePromise: Promise<void> | null = null;
    let parseError: Error | null = null;

    let parser: ReturnType<typeof Busboy>;
    try {
      parser = Busboy({
        headers: Object.fromEntries(req.headers.entries()),
        limits: { files: 1, fields: 1, fileSize: LIMITS.video + 1 },
      });
    } catch (error) {
      reject(error);
      return;
    }

    parser.on('field', (name, value) => {
      if (name === 'kind') kind = value;
    });

    parser.on('file', (name, stream, info) => {
      if (name !== 'file') {
        parseError = new Error('Invalid upload field.');
        stream.resume();
        return;
      }

      const tempPath = createTempUploadPath(submissionId);
      upload = {
        kind: '',
        originalName: path.basename(info.filename || 'upload'),
        mimeType: info.mimeType || 'application/octet-stream',
        size: 0,
        tempPath,
        truncated: false,
      };

      stream.on('data', (chunk: Buffer) => {
        if (upload) upload.size += chunk.length;
      });
      stream.on('limit', () => {
        if (upload) upload.truncated = true;
      });
      writePromise = pipeline(stream, fs.createWriteStream(tempPath));
    });

    parser.on('filesLimit', () => { parseError = new Error('Only one file can be uploaded at a time.'); });
    parser.on('error', (error) => {
      parseError = error instanceof Error ? error : new Error(String(error));
    });
    parser.on('finish', async () => {
      try {
        if (writePromise) await writePromise;
        if (parseError) throw parseError;
        if (!upload) throw new Error('No file uploaded.');
        upload.kind = kind;
        resolve(upload);
      } catch (error) {
        if (upload) removeTempUpload(upload.tempPath);
        reject(error);
      }
    });

    Readable.fromWeb(req.body as any).on('error', reject).pipe(parser);
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let participant;
  try { participant = await requireParticipant(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (settings?.deadline && settings.deadline.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Submissions are closed.' }, { status: 403 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { members: true, files: true },
  });
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const hasAccess = submission.ownerId === participant.id || submission.members.some((member) => member.participantId === participant.id);
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let upload: ParsedUpload;
  try {
    upload = await parseUpload(req, submission.id);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload failed.' }, { status: 400 });
  }

  const kind = upload.kind as keyof typeof ACCEPT;
  if (!['summary', 'screenshot', 'video'].includes(kind)) {
    removeTempUpload(upload.tempPath);
    return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
  }

  if (upload.truncated || upload.size > LIMITS[kind]) {
    removeTempUpload(upload.tempPath);
    return NextResponse.json({ error: 'File too large.' }, { status: 400 });
  }

  const acceptedMimeTypes = ACCEPT[kind] as readonly string[];
  const acceptedExtensions = ACCEPT_EXTENSIONS[kind] as readonly string[];
  const extension = path.extname(upload.originalName).toLowerCase();
  if (!acceptedMimeTypes.includes(upload.mimeType) && !acceptedExtensions.includes(extension)) {
    removeTempUpload(upload.tempPath);
    return NextResponse.json({ error: 'Unsupported file format.' }, { status: 400 });
  }

  if (kind === 'screenshot' && submission.files.filter((file) => file.kind === 'screenshot').length >= LIMITS.maxScreenshots) {
    removeTempUpload(upload.tempPath);
    return NextResponse.json({ error: `Max ${LIMITS.maxScreenshots} screenshots.` }, { status: 400 });
  }

  let storagePath: string;
  try {
    storagePath = await commitTempUpload(upload.tempPath, submission.id, kind, upload.originalName);
  } catch {
    removeTempUpload(upload.tempPath);
    return NextResponse.json({ error: 'Could not store uploaded file.' }, { status: 500 });
  }

  if (kind === 'summary' || kind === 'video') {
    const oldFiles = submission.files.filter((file) => file.kind === kind);
    for (const file of oldFiles) removeFile(file.storagePath);
    await prisma.submissionFile.deleteMany({ where: { submissionId: submission.id, kind } });
  }

  const position = kind === 'screenshot'
    ? ((await prisma.submissionFile.aggregate({ where: { submissionId: submission.id, kind: 'screenshot' }, _max: { position: true } }))._max.position ?? -1) + 1
    : 0;

  try {
    const created = await prisma.submissionFile.create({
      data: {
        submissionId: submission.id,
        kind,
        originalName: upload.originalName,
        storagePath,
        mimeType: upload.mimeType,
        size: upload.size,
        position,
      },
    });
    return NextResponse.json({
      file: { id: created.id, kind, originalName: created.originalName, size: created.size, position: created.position },
    });
  } catch (error) {
    removeFile(storagePath);
    throw error;
  }
}

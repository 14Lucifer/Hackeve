import fs from 'node:fs';
import { prisma } from '@/lib/db';
import { readSession, requireJudge } from '@/lib/auth';
import { absPath } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const file = await prisma.submissionFile.findUnique({
    where: { id: params.id },
    include: { submission: { include: { members: true } } },
  });
  if (!file) return new Response('Not found', { status: 404 });

  if (session.role === 'participant') {
    const isOwner = file.submission.ownerId === session.pid;
    const isMember = file.submission.members.some((member) => member.participantId === session.pid);
    if (!isOwner && !isMember) return new Response('Forbidden', { status: 403 });
  }
  if (session.role === 'judge') {
    try { await requireJudge(); } catch { return new Response('Unauthorized', { status: 401 }); }
    if (!file.submission.isFinalist) return new Response('Forbidden', { status: 403 });
  }

  const filePath = absPath(file.storagePath);
  if (!fs.existsSync(filePath)) return new Response('Missing', { status: 404 });

  const headers: Record<string, string> = {
    'content-type': file.mimeType || 'application/octet-stream',
    'content-disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
    'accept-ranges': 'bytes',
    'cache-control': 'private, no-store',
  };
  const range = req.headers.get('range');

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return new Response('Invalid range', { status: 416 });
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : file.size - 1;
    if (start > end || end >= file.size) {
      return new Response('Range not satisfiable', { status: 416, headers: { 'content-range': `bytes */${file.size}` } });
    }
    headers['content-length'] = String(end - start + 1);
    headers['content-range'] = `bytes ${start}-${end}/${file.size}`;
    return new Response(fs.createReadStream(filePath, { start, end }) as any, { status: 206, headers });
  }

  headers['content-length'] = String(file.size);
  return new Response(fs.createReadStream(filePath) as any, { headers });
}

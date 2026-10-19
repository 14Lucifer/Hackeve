import archiver from 'archiver';
import { PassThrough } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './db';
import { absPath } from './storage';
import { sanitize } from './util';

type SubmissionWithRels = Awaited<ReturnType<typeof fetchSubmission>>;

async function fetchSubmission(id: string) {
  return prisma.submission.findUnique({
    where: { id },
    include: {
      owner: true,
      members: { include: { participant: true } },
      files: true,
    },
  });
}

function manifestFor(sub: NonNullable<SubmissionWithRels>) {
  return {
    teamName: sub.teamName,
    projectName: sub.projectName,
    description: sub.description,
    status: sub.status,
    submittedAt: sub.submittedAt,
    updatedAt: sub.updatedAt,
    owner: sub.owner.email,
    members: sub.members.map((m) => m.participant.email),
    files: sub.files.map((f) => ({
      kind: f.kind,
      originalName: f.originalName,
      size: f.size,
    })),
  };
}

export async function buildSubmissionZip(submissionId: string, stream: NodeJS.WritableStream, nested = false) {
  const sub = await fetchSubmission(submissionId);
  if (!sub) throw new Error('Submission not found');
  const archive = archiver('zip', { zlib: { level: nested ? 0 : 6 }, store: nested });
  archive.pipe(stream);
  const folder = `${sanitize(sub.teamName)}_${sanitize(sub.projectName)}`;

  archive.append(JSON.stringify(manifestFor(sub), null, 2), {
    name: `${folder}/submission.json`,
  });

  const summary = sub.files.filter((f) => f.kind === 'summary');
  const shots   = sub.files.filter((f) => f.kind === 'screenshot').sort((a, b) => a.position - b.position);
  const videos  = sub.files.filter((f) => f.kind === 'video');

  for (const f of summary) {
    const p = absPath(f.storagePath);
    if (fs.existsSync(p)) archive.file(p, { name: `${folder}/summary/${sanitize(f.originalName)}` });
  }
  shots.forEach((f, i) => {
    const p = absPath(f.storagePath);
    const idx = String(i + 1).padStart(2, '0');
    if (fs.existsSync(p)) archive.file(p, { name: `${folder}/screenshots/${idx}_${sanitize(f.originalName)}` });
  });
  for (const f of videos) {
    const p = absPath(f.storagePath);
    if (fs.existsSync(p)) archive.file(p, { name: `${folder}/video/${sanitize(f.originalName)}` });
  }

  await archive.finalize();
  return `${folder}.zip`;
}

export async function buildBatchZip(ids: string[], stream: NodeJS.WritableStream) {
  const archive = archiver('zip', { zlib: { level: 0 }, store: true });
  archive.pipe(stream);

  const subs = await prisma.submission.findMany({
    where: { id: { in: ids } },
    include: { owner: true, members: { include: { participant: true } }, files: true },
  });

  const manifestRows = ['id,team_name,project_name,status,owner_email,members,submitted_at'];
  const usedNames = new Set<string>();

  for (const sub of subs) {
    let base = `${sanitize(sub.teamName)}_${sanitize(sub.projectName)}`;
    let name = `${base}.zip`;
    let i = 1;
    while (usedNames.has(name)) { name = `${base}_${sub.id.slice(0, 6)}.zip`; i++; if (i > 2) break; }
    usedNames.add(name);

    const inner = new PassThrough();
    const innerArchive = archiver('zip', { zlib: { level: 6 } });
    innerArchive.pipe(inner);

    const folder = base;
    innerArchive.append(JSON.stringify(manifestFor(sub as any), null, 2), { name: `${folder}/submission.json` });

    const summary = sub.files.filter((f) => f.kind === 'summary');
    const shots   = sub.files.filter((f) => f.kind === 'screenshot').sort((a, b) => a.position - b.position);
    const videos  = sub.files.filter((f) => f.kind === 'video');

    for (const f of summary) {
      const p = absPath(f.storagePath);
      if (fs.existsSync(p)) innerArchive.file(p, { name: `${folder}/summary/${sanitize(f.originalName)}` });
    }
    shots.forEach((f, idx) => {
      const p = absPath(f.storagePath);
      const n = String(idx + 1).padStart(2, '0');
      if (fs.existsSync(p)) innerArchive.file(p, { name: `${folder}/screenshots/${n}_${sanitize(f.originalName)}` });
    });
    for (const f of videos) {
      const p = absPath(f.storagePath);
      if (fs.existsSync(p)) innerArchive.file(p, { name: `${folder}/video/${sanitize(f.originalName)}` });
    }

    archive.append(inner, { name });
    await innerArchive.finalize();

    const members = sub.members.map((m) => m.participant.email).join('; ');
    manifestRows.push([
      sub.id,
      JSON.stringify(sub.teamName),
      JSON.stringify(sub.projectName),
      sub.status,
      sub.owner.email,
      JSON.stringify(members),
      sub.submittedAt?.toISOString() ?? '',
    ].join(','));
  }

  archive.append(manifestRows.join('\n'), { name: 'manifest.csv' });
  await archive.finalize();
}

export function timestampTag() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}_${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

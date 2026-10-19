import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireParticipant } from '@/lib/auth';
import { removeFile } from '@/lib/storage';

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  let p; try { p = await requireParticipant(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (settings?.deadline && new Date(settings.deadline).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Submissions are closed.' }, { status: 403 });
  }

  const file = await prisma.submissionFile.findUnique({
    where: { id: params.id },
    include: { submission: { include: { members: true } } },
  });
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ok = file.submission.ownerId === p.id || file.submission.members.some((m) => m.participantId === p.id);
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  removeFile(file.storagePath);
  await prisma.submissionFile.delete({ where: { id: file.id } });
  return NextResponse.json({ ok: true });
}

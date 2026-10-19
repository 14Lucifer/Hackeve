import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireParticipant } from '@/lib/auth';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  let p; try { p = await requireParticipant(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (settings?.deadline && new Date(settings.deadline).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Submissions are closed.' }, { status: 403 });
  }

  const sub = await prisma.submission.findUnique({
    where: { id: params.id },
    include: { members: true, files: true },
  });
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ok = sub.ownerId === p.id || sub.members.some((m) => m.participantId === p.id);
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Validate mandatory fields.
  if (!sub.teamName.trim() || !sub.projectName.trim() || !sub.description.trim()) {
    return NextResponse.json({ error: 'Team name, project name, and description are required.' }, { status: 400 });
  }
  const summary = sub.files.find((f) => f.kind === 'summary');
  if (!summary) return NextResponse.json({ error: 'A project summary file is required.' }, { status: 400 });

  await prisma.submission.update({
    where: { id: params.id },
    data: { status: 'submitted', submittedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

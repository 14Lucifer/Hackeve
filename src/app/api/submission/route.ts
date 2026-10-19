import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireParticipant } from '@/lib/auth';

async function assertNotClosed() {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (s?.deadline && new Date(s.deadline).getTime() < Date.now()) {
    throw new Error('Submissions are closed.');
  }
}

export async function POST(req: Request) {
  let p; try { p = await requireParticipant(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try { await assertNotClosed(); } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 403 }); }

  const existing = await prisma.submission.findFirst({
    where: { OR: [{ ownerId: p.id }, { members: { some: { participantId: p.id } } }] },
  });
  if (existing) return NextResponse.json({ id: existing.id });

  const body = await req.json().catch(() => ({}));
  const sub = await prisma.submission.create({
    data: {
      teamName: body.teamName || '',
      projectName: body.projectName || '',
      description: body.description || '',
      ownerId: p.id,
      members: { create: [{ participantId: p.id }] },
    },
  });
  return NextResponse.json({ id: sub.id });
}

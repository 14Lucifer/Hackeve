import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireParticipant } from '@/lib/auth';
import { z } from 'zod';

async function assertNotClosed() {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (s?.deadline && new Date(s.deadline).getTime() < Date.now()) throw new Error('Submissions are closed.');
}

async function assertAccess(submissionId: string, pid: string) {
  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { members: true },
  });
  if (!sub) throw new Error('Not found');
  const ok = sub.ownerId === pid || sub.members.some((m) => m.participantId === pid);
  if (!ok) throw new Error('Forbidden');
  return sub;
}

const Body = z.object({
  teamName: z.string().optional(),
  projectName: z.string().optional(),
  description: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let p; try { p = await requireParticipant(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try { await assertNotClosed(); } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 403 }); }
  try { await assertAccess(params.id, p.id); } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 403 }); }

  const body = Body.parse(await req.json());

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: params.id },
      data: {
        teamName: body.teamName ?? undefined,
        projectName: body.projectName ?? undefined,
        description: body.description ?? undefined,
      },
    });
    if (body.memberIds) {
      const ids = Array.from(new Set([...body.memberIds, p.id]));
      await tx.submissionMember.deleteMany({ where: { submissionId: params.id } });
      await tx.submissionMember.createMany({
        data: ids.map((participantId) => ({ submissionId: params.id, participantId })),
        skipDuplicates: true,
      });
    }
  });
  return NextResponse.json({ ok: true });
}

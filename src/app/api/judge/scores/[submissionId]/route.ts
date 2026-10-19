import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireJudge } from '@/lib/auth';
import { prisma } from '@/lib/db';

const Score = z.object({
  valuePracticality: z.number().int().min(1).max(5),
  creativity: z.number().int().min(1).max(5),
  aiTechnical: z.number().int().min(1).max(5),
  completenessUx: z.number().int().min(1).max(5),
  responsibleAi: z.number().int().min(1).max(5),
  notes: z.string().max(2000).optional(),
});

export async function PUT(req: Request, { params }: { params: { submissionId: string } }) {
  let judge;
  try { judge = await requireJudge(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (settings?.judgingDeadline && settings.judgingDeadline.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Judging is closed.' }, { status: 403 });
  }

  const submission = await prisma.submission.findFirst({
    where: { id: params.submissionId, isFinalist: true, status: 'submitted' },
  });
  if (!submission) return NextResponse.json({ error: 'Finalist not found.' }, { status: 404 });

  try {
    const score = Score.parse(await req.json());
    const saved = await prisma.judgeScore.upsert({
      where: { judgeId_submissionId: { judgeId: judge.id, submissionId: submission.id } },
      create: { judgeId: judge.id, submissionId: submission.id, ...score },
      update: { ...score, completedAt: new Date() },
    });
    return NextResponse.json({ score: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Every score must be between 1 and 5.' }, { status: 400 });
  }
}

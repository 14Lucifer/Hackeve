import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const submissions = await prisma.submission.findMany({
    where: { status: 'submitted' },
    orderBy: [{ isFinalist: 'desc' }, { submittedAt: 'asc' }],
    include: {
      recommendedQuestions: { orderBy: { position: 'asc' } },
      _count: { select: { scores: true, members: true } },
    },
  });
  return NextResponse.json({
    submissions: submissions.map((submission) => ({
      id: submission.id,
      teamName: submission.teamName,
      projectName: submission.projectName,
      isFinalist: submission.isFinalist,
      submittedAt: submission.submittedAt,
      questions: submission.recommendedQuestions.map((question) => question.text),
      scoreCount: submission._count.scores,
      memberCount: submission._count.members,
    })),
  });
}

const Selection = z.object({ submissionId: z.string(), isFinalist: z.boolean() });

export async function PUT(req: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const body = Selection.parse(await req.json());
    const submission = await prisma.submission.findUnique({ where: { id: body.submissionId } });
    if (!submission || submission.status !== 'submitted') {
      return NextResponse.json({ error: 'Only submitted projects can be finalists.' }, { status: 400 });
    }
    if (body.isFinalist && !submission.isFinalist) {
      const count = await prisma.submission.count({ where: { isFinalist: true } });
      if (count >= 10) return NextResponse.json({ error: 'You can select a maximum of 10 finalists.' }, { status: 400 });
    }
    await prisma.submission.update({
      where: { id: body.submissionId },
      data: {
        isFinalist: body.isFinalist,
        finalistSelectedAt: body.isFinalist ? submission.finalistSelectedAt || new Date() : null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invalid request' }, { status: 400 });
  }
}

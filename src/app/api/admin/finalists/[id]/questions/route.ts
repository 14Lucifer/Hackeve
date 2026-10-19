import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

const Body = z.object({
  questions: z.array(z.string().trim().min(1).max(500)).length(3),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const { questions } = Body.parse(await req.json());
    const submission = await prisma.submission.findUnique({ where: { id: params.id } });
    if (!submission?.isFinalist) {
      return NextResponse.json({ error: 'Questions can only be added to a finalist.' }, { status: 400 });
    }
    await prisma.$transaction(async (tx) => {
      await tx.recommendedQuestion.deleteMany({ where: { submissionId: params.id } });
      await tx.recommendedQuestion.createMany({
        data: questions.map((text, position) => ({ submissionId: params.id, text, position })),
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Enter all three questions.' }, { status: 400 });
  }
}

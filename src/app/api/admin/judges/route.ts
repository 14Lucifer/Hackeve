import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

const CreateJudge = z.object({
  username: z.string().trim().min(3).max(50),
  displayName: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(100),
});

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const finalists = await prisma.submission.count({ where: { isFinalist: true, status: 'submitted' } });
  const judges = await prisma.judge.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { scores: true } } },
  });
  return NextResponse.json({
    finalists,
    judges: judges.map((judge) => ({
      id: judge.id,
      username: judge.username,
      displayName: judge.displayName,
      locked: judge.locked,
      scoreCount: judge._count.scores,
      createdAt: judge.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const body = CreateJudge.parse(await req.json());
    if (await prisma.judge.count() >= 3) {
      return NextResponse.json({ error: 'A maximum of three judge accounts is allowed.' }, { status: 400 });
    }
    const judge = await prisma.judge.create({
      data: {
        username: body.username,
        displayName: body.displayName,
        passwordHash: await bcrypt.hash(body.password, 10),
      },
      select: { id: true, username: true, displayName: true, locked: true, createdAt: true },
    });
    return NextResponse.json({ judge });
  } catch (error: any) {
    const duplicate = error?.code === 'P2002';
    return NextResponse.json({ error: duplicate ? 'Username already exists.' : error.message || 'Invalid request' }, { status: duplicate ? 409 : 400 });
  }
}

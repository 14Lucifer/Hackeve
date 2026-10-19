import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

const UpdateJudge = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  locked: z.boolean().optional(),
  password: z.string().min(8).max(100).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const body = UpdateJudge.parse(await req.json());
    const judge = await prisma.judge.update({
      where: { id: params.id },
      data: {
        displayName: body.displayName,
        locked: body.locked,
        passwordHash: body.password ? await bcrypt.hash(body.password, 10) : undefined,
      },
      select: { id: true, username: true, displayName: true, locked: true },
    });
    return NextResponse.json({ judge });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  await prisma.judge.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

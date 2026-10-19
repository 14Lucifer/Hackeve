import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const Body = z.object({ locked: z.boolean().optional() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const { locked } = Body.parse(await req.json());
  const u = await prisma.participant.update({ where: { id: params.id }, data: { locked: !!locked } });
  return NextResponse.json({ user: u });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  await prisma.participant.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

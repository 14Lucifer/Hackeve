import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const Body = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(['lock', 'unlock', 'delete']),
});

export async function POST(req: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const { ids, action } = Body.parse(await req.json());
  if (action === 'delete') {
    await prisma.participant.deleteMany({ where: { id: { in: ids } } });
  } else {
    await prisma.participant.updateMany({
      where: { id: { in: ids } },
      data: { locked: action === 'lock' },
    });
  }
  return NextResponse.json({ ok: true, count: ids.length });
}

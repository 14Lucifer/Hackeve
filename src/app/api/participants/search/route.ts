import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireParticipant } from '@/lib/auth';

export async function GET(req: Request) {
  try { await requireParticipant(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  if (!q) return NextResponse.json({ results: [] });
  const results = await prisma.participant.findMany({
    where: { email: { contains: q, mode: 'insensitive' }, locked: false },
    take: 20,
    orderBy: { email: 'asc' },
    select: { id: true, email: true },
  });
  return NextResponse.json({ results });
}

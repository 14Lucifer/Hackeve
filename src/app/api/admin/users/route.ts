import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

export async function GET() {
  try {
    await requireAdmin();
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const users = await prisma.participant.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ users });
}

const Body = z.object({ email: z.string().email() });
export async function POST(req: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const { email } = Body.parse(await req.json());
    const normalized = email.trim().toLowerCase();
    const existing = await prisma.participant.findUnique({ where: { email: normalized } });
    if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    const u = await prisma.participant.create({ data: { email: normalized } });
    return NextResponse.json({ user: u });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid' }, { status: 400 });
  }
}

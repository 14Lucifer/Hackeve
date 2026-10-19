import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { z } from 'zod';

const Body = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const { email } = Body.parse(await req.json());
    const normalized = email.trim().toLowerCase();
    const p = await prisma.participant.findUnique({ where: { email: normalized } });
    if (!p) return NextResponse.json({ error: 'This email is not registered.' }, { status: 404 });
    if (p.locked) return NextResponse.json({ error: 'Your account is locked. Please contact admin.' }, { status: 403 });
    await createSession({ role: 'participant', pid: p.id, email: p.email });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 });
  }
}

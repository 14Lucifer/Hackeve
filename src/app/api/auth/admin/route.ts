import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { z } from 'zod';

const Body = z.object({ username: z.string().min(1), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const { username, password } = Body.parse(await req.json());
    const a = await prisma.admin.findUnique({ where: { username } });
    if (!a) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const ok = await bcrypt.compare(password, a.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    await createSession({ role: 'admin', aid: a.id, username: a.username });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 });
  }
}

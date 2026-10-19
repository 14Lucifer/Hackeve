import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';

const Body = z.object({ username: z.string().min(1), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const { username, password } = Body.parse(await req.json());
    const judge = await prisma.judge.findUnique({ where: { username } });
    if (!judge) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    if (judge.locked) return NextResponse.json({ error: 'Your judge account is locked.' }, { status: 403 });
    if (!(await bcrypt.compare(password, judge.passwordHash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    await createSession({
      role: 'judge',
      jid: judge.id,
      username: judge.username,
      displayName: judge.displayName,
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invalid request' }, { status: 400 });
  }
}

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const COOKIE = 'hk_session';
const encoder = new TextEncoder();

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('JWT_SECRET not set or too short');
  return encoder.encode(s);
}

export type SessionPayload =
  | { role: 'participant'; pid: string; email: string }
  | { role: 'admin'; aid: string; username: string }
  | { role: 'judge'; jid: string; username: string; displayName: string };

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.DEPLOY_MODE === 'https',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const c = cookies().get(COOKIE);
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c.value, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(COOKIE);
}

export async function requireParticipant() {
  const s = await readSession();
  if (!s || s.role !== 'participant') throw new Error('UNAUTHORIZED');
  const p = await prisma.participant.findUnique({ where: { id: s.pid } });
  if (!p || p.locked) throw new Error('UNAUTHORIZED');
  return p;
}

export async function requireAdmin() {
  const s = await readSession();
  if (!s || s.role !== 'admin') throw new Error('UNAUTHORIZED');
  const a = await prisma.admin.findUnique({ where: { id: s.aid } });
  if (!a) throw new Error('UNAUTHORIZED');
  return a;
}

export async function requireJudge() {
  const s = await readSession();
  if (!s || s.role !== 'judge') throw new Error('UNAUTHORIZED');
  const judge = await prisma.judge.findUnique({ where: { id: s.jid } });
  if (!judge || judge.locked) throw new Error('UNAUTHORIZED');
  return judge;
}

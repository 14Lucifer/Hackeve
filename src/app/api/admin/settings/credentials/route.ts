import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const Body = z.object({
  currentPassword: z.string().min(1),
  newUsername: z.string().min(1).optional(),
  newPassword: z.string().min(6).optional().or(z.literal('')),
});

export async function PUT(req: Request) {
  let admin;
  try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const { currentPassword, newUsername, newPassword } = Body.parse(await req.json());
  const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

  const data: any = {};
  if (newUsername && newUsername !== admin.username) data.username = newUsername;
  if (newPassword) data.passwordHash = await bcrypt.hash(newPassword, 10);
  if (Object.keys(data).length === 0) return NextResponse.json({ ok: true });

  try {
    await prisma.admin.update({ where: { id: admin.id }, data });
  } catch (e: any) {
    return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

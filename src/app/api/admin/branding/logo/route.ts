import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { UPLOAD_DIR, ensureDir, removeFile } from '@/lib/storage';
import { LOGO_MAX_BYTES, LOGO_TYPES } from '@/lib/branding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  const extension = LOGO_TYPES[file.type];
  if (!extension) return NextResponse.json({ error: 'Use a PNG, JPG, WEBP, GIF, or SVG image.' }, { status: 400 });
  if (file.size > LOGO_MAX_BYTES) return NextResponse.json({ error: 'Logo must be 2 MB or smaller.' }, { status: 400 });

  const dir = path.join(UPLOAD_DIR, 'branding');
  ensureDir(dir);
  const fileName = `logo-${crypto.randomBytes(8).toString('hex')}${extension}`;
  await fs.promises.writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));
  const storagePath = path.join('branding', fileName);

  const previous = await prisma.settings.findUnique({ where: { id: 1 } });
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { logoPath: storagePath, logoMimeType: file.type },
    create: { id: 1, logoPath: storagePath, logoMimeType: file.type },
  });
  if (previous?.logoPath) removeFile(previous.logoPath);

  return NextResponse.json({ logoUrl: `/api/branding/logo?v=${encodeURIComponent(storagePath)}` });
}

export async function DELETE() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const previous = await prisma.settings.findUnique({ where: { id: 1 } });
  await prisma.settings.update({ where: { id: 1 }, data: { logoPath: null, logoMimeType: null } });
  if (previous?.logoPath) removeFile(previous.logoPath);
  return NextResponse.json({ ok: true });
}

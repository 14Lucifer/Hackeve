import fs from 'node:fs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { absPath } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings?.logoPath) return new NextResponse('Not found', { status: 404 });

  let data: Buffer;
  try {
    data = await fs.promises.readFile(absPath(settings.logoPath));
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      'content-type': settings.logoMimeType || 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
      // SVG logos must never run scripts when opened directly.
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}

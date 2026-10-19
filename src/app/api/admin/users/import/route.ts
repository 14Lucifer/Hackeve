import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const fd = await req.formData();
  const file = fd.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const text = await file.text();
  let rows: any[];
  try {
    rows = parse(text, { skip_empty_lines: true, trim: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'CSV parse error: ' + e.message }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errors: Array<{ line: number; email: string; reason: string }> = [];
  const seen = new Set<string>();
  const valid: string[] = [];

  rows.forEach((row, i) => {
    // Accept either single column, or "email" column by header
    const raw = Array.isArray(row) ? (row[0] || '') : String(row);
    const email = String(raw).trim().toLowerCase();
    if (!email || email === 'email') return; // header
    if (!emailRegex.test(email)) {
      errors.push({ line: i + 1, email, reason: 'Invalid email format' });
      return;
    }
    if (seen.has(email)) return;
    seen.add(email);
    valid.push(email);
  });

  const existing = await prisma.participant.findMany({
    where: { email: { in: valid } },
    select: { email: true },
  });
  const existingSet = new Set(existing.map((e) => e.email));
  const toInsert = valid.filter((e) => !existingSet.has(e));

  if (toInsert.length) {
    await prisma.participant.createMany({ data: toInsert.map((email) => ({ email })) });
  }

  return NextResponse.json({
    imported: toInsert.length,
    skipped: existingSet.size,
    errors,
  });
}

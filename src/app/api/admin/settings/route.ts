import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getBranding } from '@/lib/branding';
import { z } from 'zod';

export async function GET() {
  try {
    const admin = await requireAdmin();
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const branding = await getBranding();
    return NextResponse.json({
      deadline: settings?.deadline || null,
      judgingDeadline: settings?.judgingDeadline || null,
      rankingsPublished: settings?.rankingsPublished || false,
      eventName: branding.eventName,
      organizerName: branding.organizerName,
      logoUrl: branding.logoUrl,
      username: admin.username,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

const Body = z.object({
  deadline: z.string().datetime().nullable().optional(),
  judgingDeadline: z.string().datetime().nullable().optional(),
  rankingsPublished: z.boolean().optional(),
  eventName: z.string().trim().min(1, 'Event name is required.').max(120).optional(),
  organizerName: z.string().trim().max(160).optional(),
});

export async function PUT(req: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const body = Body.parse(await req.json());
    const data = {
      deadline: body.deadline === undefined ? undefined : body.deadline ? new Date(body.deadline) : null,
      judgingDeadline: body.judgingDeadline === undefined ? undefined : body.judgingDeadline ? new Date(body.judgingDeadline) : null,
      rankingsPublished: body.rankingsPublished,
      eventName: body.eventName,
      organizerName: body.organizerName,
    };
    await prisma.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : error.message;
    return NextResponse.json({ error: message || 'Invalid settings' }, { status: 400 });
  }
}

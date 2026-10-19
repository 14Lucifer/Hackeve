import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const subs = await prisma.submission.findMany({
    orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
    include: { owner: true, _count: { select: { members: true } } },
  });
  return NextResponse.json({
    submissions: subs.map((s) => ({
      id: s.id,
      teamName: s.teamName,
      projectName: s.projectName,
      status: s.status,
      owner: s.owner.email,
      members: s._count.members,
      submittedAt: s.submittedAt,
      updatedAt: s.updatedAt,
    })),
  });
}

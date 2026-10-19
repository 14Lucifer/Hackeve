import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET() {
  try { await requireAdmin(); } catch { return new Response('Unauthorized', { status: 401 }); }
  const subs = await prisma.submission.findMany({
    include: { owner: true, members: { include: { participant: true } }, files: true },
    orderBy: [{ submittedAt: 'desc' }],
  });
  const rows = [
    ['id','team_name','project_name','description','status','owner_email','members','summary_files','screenshots','video_files','submitted_at','updated_at'].join(',')
  ];
  for (const s of subs) {
    rows.push([
      s.id,
      csvEscape(s.teamName),
      csvEscape(s.projectName),
      csvEscape(s.description),
      s.status,
      s.owner.email,
      csvEscape(s.members.map((m) => m.participant.email).join('; ')),
      String(s.files.filter((f) => f.kind === 'summary').length),
      String(s.files.filter((f) => f.kind === 'screenshot').length),
      String(s.files.filter((f) => f.kind === 'video').length),
      s.submittedAt?.toISOString() ?? '',
      s.updatedAt.toISOString(),
    ].join(','));
  }
  return new Response(rows.join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="submissions.csv"',
    },
  });
}

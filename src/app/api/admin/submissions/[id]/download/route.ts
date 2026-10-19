import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { buildSubmissionZip } from '@/lib/zip';
import { PassThrough } from 'node:stream';
import { sanitize } from '@/lib/util';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch { return new Response('Unauthorized', { status: 401 }); }

  const sub = await prisma.submission.findUnique({ where: { id: params.id } });
  if (!sub) return new Response('Not found', { status: 404 });
  const filename = `${sanitize(sub.teamName)}_${sanitize(sub.projectName)}.zip`;

  const pass = new PassThrough();
  buildSubmissionZip(params.id, pass).catch((err) => { pass.destroy(err); });

  return new Response(pass as any, {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}

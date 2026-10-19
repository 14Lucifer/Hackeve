import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { buildBatchZip, timestampTag } from '@/lib/zip';
import { PassThrough } from 'node:stream';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  ids: z.union([z.array(z.string()).min(1), z.literal('all')]),
});

export async function POST(req: Request) {
  try { await requireAdmin(); } catch { return new Response('Unauthorized', { status: 401 }); }
  const { ids } = Body.parse(await req.json());

  let targetIds: string[];
  if (ids === 'all') {
    const all = await prisma.submission.findMany({ select: { id: true } });
    targetIds = all.map((s) => s.id);
  } else {
    targetIds = ids;
  }
  if (targetIds.length === 0) return new Response('No submissions', { status: 400 });

  const filename = `hackathon_submissions_${timestampTag()}.zip`;
  const pass = new PassThrough();
  buildBatchZip(targetIds, pass).catch((err) => { pass.destroy(err); });

  return new Response(pass as any, {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}

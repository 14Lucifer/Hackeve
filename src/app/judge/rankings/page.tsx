import Link from 'next/link';
import { EyeOff, Trophy } from 'lucide-react';
import { requireJudge } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getRanking } from '@/lib/ranking';
import { RankingTable } from '@/components/RankingTable';

export const dynamic = 'force-dynamic';

export default async function JudgeRankingsPage({ searchParams }: { searchParams: { view?: string } }) {
  const judge = await requireJudge();
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  if (!settings?.rankingsPublished) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rankings</h1>
        <div className="card mt-6 p-10 text-center">
          <EyeOff className="mx-auto h-9 w-9 text-ink-subtle" />
          <p className="mt-3 font-medium">Rankings are not published yet</p>
          <p className="mt-1 text-sm text-ink-muted">The administrator will publish results after judging is complete.</p>
        </div>
      </div>
    );
  }

  const mine = searchParams.view === 'mine';
  const rows = await getRanking(mine ? judge.id : undefined);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-brand" />
        <div><h1 className="text-2xl font-semibold tracking-tight">Rankings</h1><p className="mt-1 text-sm text-ink-muted">Published finalist results.</p></div>
      </div>
      <div className="mb-5 flex gap-2">
        <Link href="/judge/rankings" className={!mine ? 'btn-primary h-9' : 'btn-secondary h-9'}>Overall</Link>
        <Link href="/judge/rankings?view=mine" className={mine ? 'btn-primary h-9' : 'btn-secondary h-9'}>My Scores</Link>
      </div>
      <RankingTable rows={rows} showJudgeCount={!mine} />
    </div>
  );
}

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getRanking } from '@/lib/ranking';
import { RankingTable } from '@/components/RankingTable';

export const dynamic = 'force-dynamic';

export default async function RankingsPage({ searchParams }: { searchParams: { judge?: string } }) {
  const judges = await prisma.judge.findMany({ orderBy: { createdAt: 'asc' } });
  const selectedJudge = judges.find((judge) => judge.id === searchParams.judge);
  const rows = await getRanking(selectedJudge?.id);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-brand" />
          <h1 className="text-2xl font-semibold tracking-tight">Rankings</h1>
        </div>
        <p className="mt-1 text-sm text-ink-muted">Compare overall averages or scores from an individual judge.</p>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/rankings" className={!selectedJudge ? 'btn-primary h-9 whitespace-nowrap' : 'btn-secondary h-9 whitespace-nowrap'}>
          Overall
        </Link>
        {judges.map((judge) => (
          <Link
            key={judge.id}
            href={`/admin/rankings?judge=${judge.id}`}
            className={selectedJudge?.id === judge.id ? 'btn-primary h-9 whitespace-nowrap' : 'btn-secondary h-9 whitespace-nowrap'}
          >
            {judge.displayName}
          </Link>
        ))}
      </div>

      <div className="mb-4 card p-4 text-sm text-ink-muted">
        {selectedJudge
          ? `Individual ranking by ${selectedJudge.displayName}. Unscored teams appear at the bottom.`
          : 'Overall scores average all completed judge scorecards. Ties are resolved by category priority in weight order.'}
      </div>

      <RankingTable rows={rows} showJudgeCount={!selectedJudge} />
    </div>
  );
}

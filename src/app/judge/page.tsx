import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, FolderOpen, Lock } from 'lucide-react';
import { requireJudge } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { weightedScore } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export default async function JudgeDashboard() {
  const judge = await requireJudge();
  const [settings, finalists] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.submission.findMany({
      where: { isFinalist: true, status: 'submitted' },
      orderBy: { finalistSelectedAt: 'asc' },
      include: {
        scores: { where: { judgeId: judge.id } },
        recommendedQuestions: true,
        _count: { select: { members: true, files: true } },
      },
    }),
  ]);

  const scored = finalists.filter((submission) => submission.scores.length > 0).length;
  const deadline = settings?.judgingDeadline;
  const closed = Boolean(deadline && deadline.getTime() < Date.now());

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finalist Projects</h1>
          <p className="mt-1 text-sm text-ink-muted">Review every finalist and save your scores.</p>
        </div>
        <div className="card flex shrink-0 items-center gap-3 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-brand" />
          <div>
            <p className="label">Progress</p>
            <p className="font-semibold tabular">{scored} of {finalists.length} scored</p>
          </div>
        </div>
      </div>

      <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${closed ? 'border-red-200 bg-red-50 text-red-800' : 'border-line bg-white'}`}>
        {closed ? <Lock className="mt-0.5 h-5 w-5 shrink-0" /> : <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />}
        <div>
          <p className="text-sm font-medium">{closed ? 'Judging is closed' : deadline ? 'Judging deadline' : 'No judging deadline set'}</p>
          <p className="mt-0.5 text-xs opacity-75">{deadline ? deadline.toLocaleString() : 'Scores can be edited until an administrator sets and closes judging.'}</p>
        </div>
      </div>

      {finalists.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-ink-subtle" />
          <p className="mt-3 font-medium">No finalists selected</p>
          <p className="mt-1 text-sm text-ink-muted">An administrator will publish the finalist projects here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {finalists.map((submission, index) => {
            const saved = submission.scores[0];
            const total = saved ? weightedScore(saved) : null;
            return (
              <article key={submission.id} className="card flex flex-col p-5 transition hover:shadow-soft-md">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-sm font-semibold text-brand-700">{index + 1}</span>
                  {saved ? <span className="badge-success">Scored</span> : <span className="badge-muted">Not scored</span>}
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-tight">{submission.teamName}</h2>
                <p className="mt-1 text-sm text-ink-muted">{submission.projectName}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-subtle">
                  <span>{submission._count.members} members</span>
                  <span>{submission._count.files} files</span>
                  <span>{submission.recommendedQuestions.length}/3 questions</span>
                </div>
                {saved && (
                  <div className="mt-4 rounded-lg bg-brand-soft p-3">
                    <p className="text-xs font-medium text-brand-700">Your weighted score</p>
                    <p className="mt-0.5 text-xl font-semibold text-brand-700 tabular">{total!.toFixed(2)} / 5</p>
                  </div>
                )}
                <div className="mt-auto pt-5">
                  <Link href={`/judge/projects/${submission.id}`} className="btn-primary w-full">
                    {saved ? closed ? 'View Score' : 'Review / Edit' : 'Review Project'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

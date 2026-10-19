import Link from 'next/link';
import { readSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Countdown } from '@/components/Countdown';
import { ArrowRight, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const s = await readSession();
  if (!s || s.role !== 'participant') redirect('/login');
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const existing = await prisma.submission.findFirst({
    where: { OR: [{ ownerId: s.pid }, { members: { some: { participantId: s.pid } } }] },
    include: { owner: true },
  });

  const closed = !!settings?.deadline && new Date(settings.deadline).getTime() < Date.now();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
        <p className="text-sm text-ink-muted mt-1">
          Signed in as <span className="text-ink font-medium">{s.email}</span>
        </p>
      </div>

      <Countdown deadline={settings?.deadline?.toISOString() || null} />

      {closed && (
        <div className="card p-4 flex items-center gap-3 border-amber-200 bg-amber-50">
          <Lock className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            Submissions are now closed. No further edits or new submissions will be accepted.
          </p>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Your Submission</h2>
        {existing ? (
          <>
            <div className="mt-3 flex items-center gap-2">
              {existing.status === 'submitted'
                ? <span className="badge-success">Submitted</span>
                : <span className="badge-muted">Draft</span>}
              <span className="text-sm text-ink-muted">
                {existing.status === 'submitted'
                  ? `on ${existing.submittedAt?.toLocaleString()}`
                  : `last saved ${existing.updatedAt.toLocaleString()}`}
              </span>
            </div>
            <div className="mt-2">
              <p className="font-medium">{existing.projectName || '(untitled)'}</p>
              <p className="text-sm text-ink-muted">Team: {existing.teamName || '—'}</p>
              {existing.owner.id !== s.pid && (
                <p className="text-xs text-ink-muted mt-1">Owner: {existing.owner.email}</p>
              )}
            </div>
            <div className="mt-5">
              <Link href="/submission" className={closed ? 'btn-secondary' : 'btn-primary'}>
                {closed ? 'View Submission' : 'Edit Submission'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-muted mt-2">You have not started a submission yet.</p>
            <div className="mt-5">
              {closed ? (
                <button className="btn-secondary" disabled>Submissions Closed</button>
              ) : (
                <Link href="/submission" className="btn-primary">
                  Create Submission <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

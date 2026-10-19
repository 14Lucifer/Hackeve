import { prisma } from '@/lib/db';
import { CountdownInline } from '@/components/Countdown';
import { Users, FolderOpen, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [participants, submissions, settings] = await Promise.all([
    prisma.participant.count(),
    prisma.submission.findMany({ select: { status: true } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);
  const submitted = submissions.filter((s) => s.status === 'submitted').length;
  const drafts = submissions.filter((s) => s.status === 'draft').length;
  const pending = participants - submitted;

  const cards = [
    { label: 'Registered', value: participants, icon: Users },
    { label: 'Submitted', value: submitted, icon: CheckCircle2 },
    { label: 'Drafts', value: drafts, icon: FolderOpen },
    { label: 'Pending', value: Math.max(0, pending), icon: Clock },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-ink-muted mt-1">Overview of all submissions.</p>
        </div>
        <div className="card px-4 py-3 text-right">
          <div className="label mb-0.5">Time remaining</div>
          <CountdownInline deadline={settings?.deadline?.toISOString() || null} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="label">{c.label}</span>
              <c.icon className="h-4 w-4 text-brand" />
            </div>
            <div className="text-3xl font-semibold tracking-tight mt-2 tabular">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/admin/users" className="card p-5 hover:shadow-soft-md transition">
          <h2 className="text-lg font-semibold tracking-tight">Manage Users</h2>
          <p className="text-sm text-ink-muted mt-1">Import participant emails via CSV, lock, unlock, or delete accounts.</p>
        </Link>
        <Link href="/admin/submissions" className="card p-5 hover:shadow-soft-md transition">
          <h2 className="text-lg font-semibold tracking-tight">Review Submissions</h2>
          <p className="text-sm text-ink-muted mt-1">View all submitted projects, download zips, or export metadata.</p>
        </Link>
      </div>
    </div>
  );
}

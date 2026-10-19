import { prisma } from '@/lib/db';
import { readSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SubmissionForm } from '@/components/SubmissionForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SubmissionPage() {
  const s = await readSession();
  if (!s || s.role !== 'participant') redirect('/login');

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const closed = !!settings?.deadline && new Date(settings.deadline).getTime() < Date.now();

  const existing = await prisma.submission.findFirst({
    where: { OR: [{ ownerId: s.pid }, { members: { some: { participantId: s.pid } } }] },
    include: {
      members: { include: { participant: true } },
      files: true,
      owner: true,
    },
  });

  const initial = existing ? {
    id: existing.id,
    teamName: existing.teamName,
    projectName: existing.projectName,
    description: existing.description,
    status: existing.status,
    isOwner: existing.ownerId === s.pid,
    ownerEmail: existing.owner.email,
    members: existing.members.map((m) => ({ id: m.participant.id, email: m.participant.email })),
    files: existing.files.map((f) => ({ id: f.id, kind: f.kind, originalName: f.originalName, size: f.size, position: f.position })),
    submittedAt: existing.submittedAt?.toISOString() ?? null,
  } : null;

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center text-sm text-ink-muted hover:text-ink mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
      </Link>
      <SubmissionForm
        initial={initial}
        closed={closed}
        selfEmail={s.email}
        selfId={s.pid}
        deadline={settings?.deadline?.toISOString() || null}
      />
    </div>
  );
}

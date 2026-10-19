import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, FileText, MessageCircleQuestion, Users, Video } from 'lucide-react';
import { requireJudge } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fmtBytes } from '@/lib/util';
import { JudgeScoreForm } from '@/components/JudgeScoreForm';

export const dynamic = 'force-dynamic';

export default async function JudgeProjectPage({ params }: { params: { id: string } }) {
  const judge = await requireJudge();
  const [settings, submission] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.submission.findFirst({
      where: { id: params.id, isFinalist: true, status: 'submitted' },
      include: {
        owner: true,
        members: { include: { participant: true } },
        files: true,
        recommendedQuestions: { orderBy: { position: 'asc' } },
        scores: { where: { judgeId: judge.id } },
      },
    }),
  ]);
  if (!submission) notFound();

  const summary = submission.files.filter((file) => file.kind === 'summary');
  const screenshots = submission.files.filter((file) => file.kind === 'screenshot').sort((a, b) => a.position - b.position);
  const videos = submission.files.filter((file) => file.kind === 'video');
  const saved = submission.scores[0];
  const closed = Boolean(settings?.judgingDeadline && settings.judgingDeadline.getTime() < Date.now());

  const initialScore = saved ? {
    valuePracticality: saved.valuePracticality,
    creativity: saved.creativity,
    aiTechnical: saved.aiTechnical,
    completenessUx: saved.completenessUx,
    responsibleAi: saved.responsibleAi,
    notes: saved.notes,
    updatedAt: saved.updatedAt.toISOString(),
  } : null;

  return (
    <div>
      <Link href="/judge" className="mb-5 inline-flex items-center text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to finalists
      </Link>

      <div className="mb-6">
        <span className="badge-success">Finalist</span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{submission.projectName}</h1>
        <p className="mt-1 text-base text-ink-muted">{submission.teamName}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="label mb-3">Project Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-6">{submission.description}</p>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="label mb-3">Project Summary</h2>
            {summary.length === 0 ? <p className="text-sm text-ink-muted">No summary file.</p> : summary.map((file) => (
              <div key={file.id} className="space-y-3">
                <a href={`/api/files/${file.id}`} target="_blank" className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 hover:bg-bg-subtle">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-brand" />
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{file.originalName}</p><p className="text-xs text-ink-muted">{fmtBytes(file.size)}</p></div>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-ink-muted" />
                </a>
                {(file.mimeType === 'application/pdf' || file.mimeType.startsWith('text/')) && (
                  <iframe
                    src={`/api/files/${file.id}`}
                    title={file.originalName}
                    className="h-80 w-full rounded-lg border border-line bg-white sm:h-[30rem]"
                  />
                )}
              </div>
            ))}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="label mb-3">Screenshots ({screenshots.length})</h2>
            {screenshots.length === 0 ? <p className="text-sm text-ink-muted">No screenshots.</p> : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {screenshots.map((file) => (
                  <a key={file.id} href={`/api/files/${file.id}`} target="_blank" className="overflow-hidden rounded-lg border border-line bg-bg-subtle">
                    <img src={`/api/files/${file.id}`} alt={file.originalName} className="aspect-video w-full object-cover" />
                    <p className="truncate p-2 text-xs text-ink-muted">{file.originalName}</p>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="label mb-3">Demo Video</h2>
            {videos.length === 0 ? <p className="text-sm text-ink-muted">No video.</p> : videos.map((file) => (
              <div key={file.id}>
                <video controls playsInline preload="metadata" className="aspect-video w-full rounded-lg bg-black" src={`/api/files/${file.id}`} />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-muted">
                  <span className="flex min-w-0 items-center gap-1"><Video className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{file.originalName}</span></span>
                  <span className="shrink-0">{fmtBytes(file.size)}</span>
                </div>
              </div>
            ))}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <section className="card p-5">
            <h2 className="label mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Team Members</h2>
            <ul className="space-y-2 text-sm">
              {submission.members.map((member) => <li key={member.id} className="break-all">{member.participant.email}</li>)}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="label mb-3 flex items-center gap-2"><MessageCircleQuestion className="h-4 w-4" /> Recommended Questions</h2>
            {submission.recommendedQuestions.length === 0 ? (
              <p className="text-sm text-ink-muted">No questions added yet.</p>
            ) : (
              <ol className="space-y-4">
                {submission.recommendedQuestions.map((question, index) => (
                  <li key={question.id} className="flex gap-3 text-sm leading-5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-700">{index + 1}</span>
                    <span>{question.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>

      <div className="mt-6">
        <JudgeScoreForm submissionId={submission.id} initial={initialScore} closed={closed} />
      </div>
    </div>
  );
}

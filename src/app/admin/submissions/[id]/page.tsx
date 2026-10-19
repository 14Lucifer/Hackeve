import { prisma } from '@/lib/db';
import { readSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, Video } from 'lucide-react';
import { fmtBytes } from '@/lib/util';

export const dynamic = 'force-dynamic';

export default async function SubmissionDetail({ params }: { params: { id: string } }) {
  const s = await readSession();
  if (!s || s.role !== 'admin') redirect('/login');

  const sub = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      members: { include: { participant: true } },
      files: true,
    },
  });
  if (!sub) notFound();

  const summary = sub.files.filter((f) => f.kind === 'summary');
  const shots = sub.files.filter((f) => f.kind === 'screenshot').sort((a, b) => a.position - b.position);
  const videos = sub.files.filter((f) => f.kind === 'video');

  return (
    <div>
      <Link href="/admin/submissions" className="inline-flex items-center text-sm text-ink-muted hover:text-ink mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to submissions
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {sub.status === 'submitted'
              ? <span className="badge-success">Submitted</span>
              : <span className="badge-muted">Draft</span>}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{sub.projectName}</h1>
          <p className="text-sm text-ink-muted mt-1">Team: <span className="text-ink font-medium">{sub.teamName}</span></p>
        </div>
        <a href={`/api/admin/submissions/${sub.id}/download`} className="btn-primary">
          <Download className="h-4 w-4" /> Download Zip
        </a>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-semibold tracking-tight uppercase text-ink-muted mb-3">Description</h2>
            <p className="text-sm whitespace-pre-wrap">{sub.description || '—'}</p>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold tracking-tight uppercase text-ink-muted mb-3">Project Summary</h2>
            {summary.length === 0 ? (
              <p className="text-sm text-ink-muted">No file.</p>
            ) : summary.map((f) => (
              <a key={f.id} href={`/api/files/${f.id}`} className="flex items-center justify-between p-3 border border-line rounded-lg hover:bg-bg-subtle">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-brand" />
                  <div>
                    <div className="text-sm font-medium">{f.originalName}</div>
                    <div className="text-xs text-ink-muted">{fmtBytes(f.size)}</div>
                  </div>
                </div>
                <Download className="h-4 w-4 text-ink-muted" />
              </a>
            ))}
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold tracking-tight uppercase text-ink-muted mb-3">Screenshots ({shots.length})</h2>
            {shots.length === 0 ? (
              <p className="text-sm text-ink-muted">No screenshots.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {shots.map((f) => (
                  <a key={f.id} href={`/api/files/${f.id}`} target="_blank" className="group block border border-line rounded-lg overflow-hidden bg-bg-subtle">
                    <img src={`/api/files/${f.id}`} alt={f.originalName} className="w-full h-32 object-cover group-hover:opacity-90 transition" />
                    <div className="p-2 text-xs text-ink-muted truncate">{f.originalName}</div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold tracking-tight uppercase text-ink-muted mb-3">Demo Video</h2>
            {videos.length === 0 ? (
              <p className="text-sm text-ink-muted">No video.</p>
            ) : videos.map((f) => (
              <div key={f.id}>
                <video controls className="w-full rounded-lg border border-line bg-black" src={`/api/files/${f.id}`} />
                <div className="flex items-center justify-between mt-2 text-xs text-ink-muted">
                  <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" />{f.originalName}</span>
                  <span>{fmtBytes(f.size)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="label mb-3">Metadata</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-ink-muted">Owner</dt><dd className="font-medium">{sub.owner.email}</dd></div>
              <div><dt className="text-ink-muted">Submitted</dt><dd>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}</dd></div>
              <div><dt className="text-ink-muted">Last updated</dt><dd>{new Date(sub.updatedAt).toLocaleString()}</dd></div>
            </dl>
          </div>
          <div className="card p-5">
            <h3 className="label mb-3">Team Members ({sub.members.length})</h3>
            <ul className="space-y-1.5 text-sm">
              {sub.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  {m.participant.email}
                </li>
              ))}
              {sub.members.length === 0 && <li className="text-ink-muted">No members listed.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

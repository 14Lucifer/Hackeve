'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, FileText, Image as ImageIcon, Video, Search, Plus, Loader2, Send, Save, Lock } from 'lucide-react';
import { fmtBytes, LIMITS } from '@/lib/util';

type FileItem = { id: string; kind: string; originalName: string; size: number; position: number };
type Member = { id: string; email: string };
type Initial = {
  id: string;
  teamName: string;
  projectName: string;
  description: string;
  status: string;
  isOwner: boolean;
  ownerEmail: string;
  members: Member[];
  files: FileItem[];
  submittedAt: string | null;
} | null;

export function SubmissionForm({
  initial, closed, selfEmail, selfId, deadline,
}: {
  initial: Initial;
  closed: boolean;
  selfEmail: string;
  selfId: string;
  deadline: string | null;
}) {
  const router = useRouter();
  const readOnly = closed;

  const [submissionId, setSubmissionId] = useState<string | null>(initial?.id || null);
  const [teamName, setTeamName] = useState(initial?.teamName || '');
  const [projectName, setProjectName] = useState(initial?.projectName || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [members, setMembers] = useState<Member[]>(initial?.members || [{ id: selfId, email: selfEmail }]);
  const [files, setFiles] = useState<FileItem[]>(initial?.files || []);
  const [status, setStatus] = useState(initial?.status || 'draft');
  const [toast, setToast] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const summary = files.filter((f) => f.kind === 'summary');
  const shots = files.filter((f) => f.kind === 'screenshot').sort((a, b) => a.position - b.position);
  const videos = files.filter((f) => f.kind === 'video');

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  async function ensureSubmission(): Promise<string> {
    if (submissionId) return submissionId;
    const r = await fetch('/api/submission', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teamName, projectName, description }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Could not start submission');
    setSubmissionId(j.id);
    return j.id;
  }

  async function saveMeta(id: string) {
    const memberIds = members.map((m) => m.id);
    const r = await fetch(`/api/submission/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teamName, projectName, description, memberIds }),
    });
    if (!r.ok) {
      const j = await r.json();
      throw new Error(j.error || 'Save failed');
    }
  }

  async function saveDraft() {
    setSavingDraft(true);
    try {
      const id = await ensureSubmission();
      await saveMeta(id);
      setToast('Draft saved.');
    } catch (e: any) { setToast(e.message); }
    setSavingDraft(false);
  }

  async function submit() {
    if (!teamName.trim() || !projectName.trim() || !description.trim() || summary.length === 0) {
      setToast('Team name, project name, description, and summary file are required.');
      return;
    }
    setSubmitting(true);
    try {
      const id = await ensureSubmission();
      await saveMeta(id);
      const r = await fetch(`/api/submission/${id}/submit`, { method: 'POST' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Submit failed');
      setStatus('submitted');
      setToast('Submitted successfully.');
      router.refresh();
    } catch (e: any) { setToast(e.message); }
    setSubmitting(false);
  }

  async function doUpload(kind: 'summary' | 'screenshot' | 'video', file: File) {
    const limits = kind === 'summary' ? LIMITS.summary : kind === 'screenshot' ? LIMITS.screenshot : LIMITS.video;
    if (file.size > limits) { setToast(`File too large (max ${fmtBytes(limits)}).`); return; }
    if (kind === 'screenshot' && shots.length >= LIMITS.maxScreenshots) {
      setToast(`Max ${LIMITS.maxScreenshots} screenshots.`); return;
    }
    setUploading(kind);
    try {
      const id = await ensureSubmission();
      const fd = new FormData();
      fd.append('kind', kind);
      fd.append('file', file);
      const r = await fetch(`/api/submission/${id}/upload`, { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Upload failed');
      if (kind === 'summary' || kind === 'video') {
        setFiles((prev) => [...prev.filter((f) => f.kind !== kind), j.file]);
      } else {
        setFiles((prev) => [...prev, j.file]);
      }
      setToast(`${file.name} uploaded.`);
    } catch (e: any) { setToast(e.message); }
    setUploading(null);
  }

  async function deleteFile(fileId: string) {
    const r = await fetch(`/api/submission/file/${fileId}`, { method: 'DELETE' });
    if (r.ok) setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Project Submission</h1>
          <p className="text-sm text-ink-muted mt-1">
            Fill out the details below.
            {status === 'submitted' && ' Already submitted — you can still edit until the deadline.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === 'submitted' && <span className="badge-success">Submitted</span>}
          {status === 'draft' && <span className="badge-muted">Draft</span>}
        </div>
      </div>

      {closed && (
        <div className="card p-4 flex items-center gap-3 border-amber-200 bg-amber-50">
          <Lock className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">Submissions are closed. This submission is now read-only.</p>
        </div>
      )}

      <fieldset disabled={readOnly} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold tracking-tight uppercase text-ink-muted">Details</h2>
          <div>
            <label className="label block mb-1.5">Team Name <span className="text-red-500">*</span></label>
            <input className="input" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>
          <div>
            <label className="label block mb-1.5">Project Name <span className="text-red-500">*</span></label>
            <input className="input" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </div>
          <div>
            <label className="label block mb-1.5">Brief Project Description <span className="text-red-500">*</span></label>
            <textarea className="input py-2 min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <MemberPicker members={members} setMembers={setMembers} selfId={selfId} />

        <FileSection
          title="Project Summary File *"
          subtitle="One file required. PDF, DOC, DOCX, TXT, Markdown, or ZIP."
          kind="summary"
          files={summary}
          onUpload={(f) => doUpload('summary', f)}
          onDelete={deleteFile}
          uploading={uploading === 'summary'}
          max={1}
          accept=".pdf,.doc,.docx,.txt,.md,.markdown,.zip"
          icon={<FileText className="h-5 w-5 text-brand" />}
        />
        <FileSection
          title="Project Demonstration Screenshots"
          subtitle={`Up to ${LIMITS.maxScreenshots} images.`}
          kind="screenshot"
          files={shots}
          onUpload={(f) => doUpload('screenshot', f)}
          onDelete={deleteFile}
          uploading={uploading === 'screenshot'}
          max={LIMITS.maxScreenshots}
          accept="image/*"
          icon={<ImageIcon className="h-5 w-5 text-brand" />}
        />
        <FileSection
          title="Project Demonstration Video"
          subtitle="One video file, up to 2 GB."
          kind="video"
          files={videos}
          onUpload={(f) => doUpload('video', f)}
          onDelete={deleteFile}
          uploading={uploading === 'video'}
          max={1}
          accept="video/*"
          icon={<Video className="h-5 w-5 text-brand" />}
        />

        <div className="sticky bottom-4">
          <div className="card p-4 flex items-center justify-end gap-2 shadow-soft-md">
            <button onClick={saveDraft} className="btn-secondary" disabled={savingDraft || submitting}>
              {savingDraft && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button onClick={submit} className="btn-primary" disabled={submitting || savingDraft}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4" /> {status === 'submitted' ? 'Resubmit' : 'Submit'}
            </button>
          </div>
        </div>
      </fieldset>

      {toast && <div className="fixed top-6 right-6 card px-4 py-3 text-sm animate-fade-in z-50 shadow-soft-md">{toast}</div>}
    </div>
  );
}

function FileSection({
  title, subtitle, kind, files, onUpload, onDelete, uploading, max, accept, icon,
}: {
  title: string; subtitle: string; kind: string;
  files: FileItem[]; onUpload: (f: File) => void; onDelete: (id: string) => void;
  uploading: boolean; max: number; accept: string; icon: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const atLimit = files.length >= max;
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight uppercase text-ink-muted">{title}</h2>
          <p className="text-xs text-ink-muted mt-1">{subtitle}</p>
        </div>
        <button
          type="button"
          className="btn-secondary h-9 text-sm"
          onClick={() => ref.current?.click()}
          disabled={atLimit || uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
        </button>
        <input
          ref={ref}
          type="file"
          accept={accept}
          multiple={kind === 'screenshot'}
          className="hidden"
          onChange={(e) => {
            const list = e.target.files;
            if (!list) return;
            if (kind === 'screenshot') Array.from(list).forEach(onUpload);
            else if (list[0]) onUpload(list[0]);
            e.target.value = '';
          }}
        />
      </div>

      {files.length === 0 ? (
        <div className="border-2 border-dashed border-line rounded-lg py-8 text-center text-sm text-ink-muted">
          No files yet.
        </div>
      ) : kind === 'screenshot' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {files.map((f) => (
            <div key={f.id} className="relative group border border-line rounded-lg overflow-hidden bg-bg-subtle">
              <img src={`/api/files/${f.id}`} alt="" className="w-full h-28 object-cover" />
              <div className="p-2 text-xs truncate">{f.originalName}</div>
              <button
                onClick={() => onDelete(f.id)}
                className="absolute top-1.5 right-1.5 h-6 w-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-soft"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        files.map((f) => (
          <div key={f.id} className="flex items-center justify-between p-3 border border-line rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              {icon}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{f.originalName}</div>
                <div className="text-xs text-ink-muted">{fmtBytes(f.size)}</div>
              </div>
            </div>
            <button onClick={() => onDelete(f.id)} className="btn-ghost h-8 text-xs"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))
      )}
    </div>
  );
}

function MemberPicker({ members, setMembers, selfId }: { members: Member[]; setMembers: (m: Member[]) => void; selfId: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) { setResults([]); return; }
      setLoading(true);
      const r = await fetch(`/api/participants/search?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      setResults(j.results || []);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const existingIds = new Set(members.map((m) => m.id));

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight uppercase text-ink-muted">Team Members</h2>
          <p className="text-xs text-ink-muted mt-1">Add every team member including yourself. {members.length} added.</p>
        </div>
        <button type="button" className="btn-secondary h-9 text-sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />Add Member
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => (
          <span key={m.id} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-brand-soft text-brand-700 text-xs font-medium">
            {m.email}
            {m.id === selfId && <span className="text-[10px] text-brand-700/70">(you)</span>}
            {m.id !== selfId && (
              <button onClick={() => setMembers(members.filter((x) => x.id !== m.id))} className="hover:bg-white/50 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {members.length === 0 && <span className="text-sm text-ink-muted">No members yet.</span>}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card p-5 w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold tracking-tight">Add Team Member</h3>
              <button onClick={() => { setOpen(false); setQ(''); }} className="text-ink-muted hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
              <input autoFocus className="input pl-9" placeholder="Search by email..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto border border-line rounded-lg">
              {loading && <div className="p-3 text-sm text-ink-muted text-center">Searching...</div>}
              {!loading && results.length === 0 && q && <div className="p-3 text-sm text-ink-muted text-center">No matching emails.</div>}
              {!loading && results.map((r) => {
                const already = existingIds.has(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={already}
                    onClick={() => { setMembers([...members, r]); setOpen(false); setQ(''); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-bg-subtle disabled:opacity-50 disabled:bg-bg-subtle text-left"
                  >
                    <span>{r.email}</span>
                    {already && <span className="text-xs text-ink-muted">Already added</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Loader2, Save, Search, Star } from 'lucide-react';

type Submission = {
  id: string;
  teamName: string;
  projectName: string;
  isFinalist: boolean;
  submittedAt: string;
  questions: string[];
  scoreCount: number;
  memberCount: number;
};

export default function FinalistsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [questions, setQuestions] = useState<Record<string, string[]>>({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch('/api/admin/finalists');
    const data = await response.json();
    const rows = data.submissions || [];
    setSubmissions(rows);
    setQuestions(Object.fromEntries(rows.map((row: Submission) => [row.id, [row.questions[0] || '', row.questions[1] || '', row.questions[2] || '']])));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const selectedCount = submissions.filter((submission) => submission.isFinalist).length;
  const filtered = submissions.filter((submission) =>
    `${submission.teamName} ${submission.projectName}`.toLowerCase().includes(query.toLowerCase())
  );

  async function setFinalist(submission: Submission) {
    setBusyId(submission.id);
    const response = await fetch('/api/admin/finalists', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ submissionId: submission.id, isFinalist: !submission.isFinalist }),
    });
    const data = await response.json();
    setMessage(response.ok ? (!submission.isFinalist ? 'Finalist selected.' : 'Finalist removed.') : data.error);
    if (response.ok) await load();
    setBusyId(null);
  }

  function updateQuestion(id: string, index: number, value: string) {
    setQuestions((current) => {
      const next = [...(current[id] || ['', '', ''])];
      next[index] = value;
      return { ...current, [id]: next };
    });
  }

  async function saveQuestions(id: string) {
    setBusyId(id);
    const response = await fetch(`/api/admin/finalists/${id}/questions`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ questions: questions[id] }),
    });
    const data = await response.json();
    setMessage(response.ok ? 'Recommended questions saved.' : data.error);
    setBusyId(null);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finalists</h1>
          <p className="mt-1 text-sm text-ink-muted">Select up to 10 submitted teams and add three questions for each.</p>
        </div>
        <div className="card shrink-0 px-4 py-3">
          <p className="label">Selected</p>
          <p className="mt-0.5 text-xl font-semibold tabular">{selectedCount} / 10</p>
        </div>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <input className="input pl-9" placeholder="Search teams or projects..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      {loading ? (
        <div className="card p-12 text-center"><Loader2 className="inline h-5 w-5 animate-spin text-ink-muted" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-sm text-ink-muted">No submitted projects found.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((submission) => (
            <div key={submission.id} className={`card overflow-hidden ${submission.isFinalist ? 'border-brand/50' : ''}`}>
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {submission.isFinalist && <Star className="h-4 w-4 fill-brand text-brand" />}
                    <h2 className="truncate font-semibold">{submission.teamName}</h2>
                    {submission.isFinalist && <span className="badge-success">Finalist</span>}
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{submission.projectName} · {submission.memberCount} members</p>
                  {submission.isFinalist && <p className="mt-1 text-xs text-ink-subtle">{submission.scoreCount} judge scorecards saved</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/submissions/${submission.id}`} className="btn-secondary h-9">View Project <ArrowRight className="h-4 w-4" /></Link>
                  <button
                    className={submission.isFinalist ? 'btn-secondary h-9' : 'btn-primary h-9'}
                    disabled={busyId === submission.id || (!submission.isFinalist && selectedCount >= 10)}
                    onClick={() => setFinalist(submission)}
                  >
                    {busyId === submission.id ? <Loader2 className="h-4 w-4 animate-spin" /> : submission.isFinalist ? <Check className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                    {submission.isFinalist ? 'Remove' : 'Select Finalist'}
                  </button>
                </div>
              </div>

              {submission.isFinalist && (
                <div className="border-t border-line bg-bg-subtle p-5">
                  <h3 className="label mb-3">Recommended Questions</h3>
                  <div className="space-y-3">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-700">{index + 1}</span>
                        <textarea
                          className="input min-h-[72px] py-2"
                          placeholder={`Question ${index + 1}`}
                          value={questions[submission.id]?.[index] || ''}
                          onChange={(event) => updateQuestion(submission.id, index, event.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="btn-primary h-9"
                      disabled={busyId === submission.id || questions[submission.id]?.some((question) => !question.trim())}
                      onClick={() => saveQuestions(submission.id)}
                    >
                      {busyId === submission.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Questions
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {message && <div className="card fixed right-6 top-6 z-50 px-4 py-3 text-sm shadow-soft-md">{message}</div>}
    </div>
  );
}

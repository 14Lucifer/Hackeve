'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, FileDown, ArrowRight, Loader2 } from 'lucide-react';

type Row = {
  id: string;
  teamName: string;
  projectName: string;
  status: string;
  owner: string;
  members: number;
  submittedAt: string | null;
  updatedAt: string;
};

export default function SubmissionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/admin/submissions');
    const j = await r.json();
    setRows(j.submissions);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  function toggle(id: string) {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  }
  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  async function downloadBatch(ids: string[] | 'all') {
    setBusy(true);
    const r = await fetch('/api/admin/submissions/download-batch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (r.ok) {
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = r.headers.get('content-disposition') || '';
      const match = /filename="(.+?)"/.exec(disposition);
      a.download = match ? match[1] : 'submissions.zip';
      a.click();
      URL.revokeObjectURL(url);
    }
    setBusy(false);
  }

  async function exportCsv() {
    window.location.href = '/api/admin/submissions/export';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
          <p className="text-sm text-ink-muted mt-1">All projects submitted by participants.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-secondary"><FileDown className="h-4 w-4" />Export CSV</button>
          <button onClick={() => downloadBatch('all')} className="btn-secondary" disabled={busy || rows.length === 0}>
            <Download className="h-4 w-4" />Download All
          </button>
        </div>
      </div>

      <div className="card">
        {selected.size > 0 && (
          <div className="p-4 border-b border-line flex items-center justify-between animate-fade-in">
            <span className="text-sm text-ink-muted">{selected.size} selected</span>
            <button onClick={() => downloadBatch(Array.from(selected))} className="btn-primary h-9 text-sm" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Selected
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-ink-muted"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">No submissions yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-muted">
                <th className="px-4 py-2.5 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-brand" />
                </th>
                <th className="px-4 py-2.5 font-medium">Team</th>
                <th className="px-4 py-2.5 font-medium">Project</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
                <th className="px-4 py-2.5 font-medium">Members</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Submitted</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 table-row-hover">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="accent-brand" />
                  </td>
                  <td className="px-4 py-3 font-medium">{r.teamName}</td>
                  <td className="px-4 py-3">{r.projectName}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.owner}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.members}</td>
                  <td className="px-4 py-3">
                    {r.status === 'submitted'
                      ? <span className="badge-success">Submitted</span>
                      : <span className="badge-muted">Draft</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <a
                        href={`/api/admin/submissions/${r.id}/download`}
                        className="btn-ghost h-8 text-xs"
                        title="Download zip"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <Link href={`/admin/submissions/${r.id}`} className="btn-ghost h-8 text-xs">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

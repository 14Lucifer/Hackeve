'use client';

import { useEffect, useState } from 'react';
import { Gavel, KeyRound, Loader2, Lock, Plus, Trash2, Unlock, X } from 'lucide-react';

type Judge = {
  id: string;
  username: string;
  displayName: string;
  locked: boolean;
  scoreCount: number;
  createdAt: string;
};

export default function JudgesPage() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [finalists, setFinalists] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch('/api/admin/judges');
    const data = await response.json();
    setJudges(data.judges || []);
    setFinalists(data.finalists || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  async function createJudge() {
    setBusy(true);
    const response = await fetch('/api/admin/judges', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName, username, password }),
    });
    const data = await response.json();
    if (response.ok) {
      setShowCreate(false);
      setDisplayName('');
      setUsername('');
      setPassword('');
      setMessage('Judge account created.');
      await load();
    } else {
      setMessage(data.error || 'Could not create judge.');
    }
    setBusy(false);
  }

  async function updateJudge(id: string, body: Record<string, unknown>, success: string) {
    setBusy(true);
    const response = await fetch(`/api/admin/judges/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setMessage(response.ok ? success : data.error || 'Update failed.');
    if (response.ok) await load();
    setBusy(false);
  }

  async function resetPassword(judge: Judge) {
    const next = window.prompt(`Enter a new password for ${judge.displayName} (minimum 8 characters):`);
    if (!next) return;
    await updateJudge(judge.id, { password: next }, 'Password reset successfully.');
  }

  async function remove(judge: Judge) {
    if (!window.confirm(`Delete judge ${judge.displayName}? Their scores will also be deleted.`)) return;
    setBusy(true);
    const response = await fetch(`/api/admin/judges/${judge.id}`, { method: 'DELETE' });
    setMessage(response.ok ? 'Judge deleted.' : 'Delete failed.');
    if (response.ok) await load();
    setBusy(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Judges</h1>
          <p className="mt-1 text-sm text-ink-muted">Create and manage up to three judge accounts.</p>
        </div>
        <button className="btn-primary shrink-0" disabled={judges.length >= 3} onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add Judge
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="label">Judge Accounts</p>
          <p className="mt-2 text-3xl font-semibold tabular">{judges.length} / 3</p>
        </div>
        <div className="card p-5">
          <p className="label">Selected Finalists</p>
          <p className="mt-2 text-3xl font-semibold tabular">{finalists} / 10</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="inline h-5 w-5 animate-spin text-ink-muted" /></div>
        ) : judges.length === 0 ? (
          <div className="p-12 text-center">
            <Gavel className="mx-auto h-8 w-8 text-ink-subtle" />
            <p className="mt-3 font-medium">No judges yet</p>
            <p className="mt-1 text-sm text-ink-muted">Create the first judge credential to begin.</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {judges.map((judge) => (
              <div key={judge.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{judge.displayName}</p>
                    <span className={judge.locked ? 'badge-danger' : 'badge-success'}>{judge.locked ? 'Locked' : 'Active'}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">Username: {judge.username}</p>
                  <p className="mt-1 text-xs text-ink-subtle">Scored {judge.scoreCount} of {finalists} finalists</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary h-9" disabled={busy} onClick={() => resetPassword(judge)}>
                    <KeyRound className="h-4 w-4" /> Reset Password
                  </button>
                  <button
                    className="btn-secondary h-9"
                    disabled={busy}
                    onClick={() => updateJudge(judge.id, { locked: !judge.locked }, judge.locked ? 'Judge unlocked.' : 'Judge locked.')}
                  >
                    {judge.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {judge.locked ? 'Unlock' : 'Lock'}
                  </button>
                  <button className="btn-ghost h-9 text-red-600 hover:bg-red-50" disabled={busy} onClick={() => remove(judge)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="card w-full max-w-md p-6 animate-fade-in">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Create Judge</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-4 w-4 text-ink-muted" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label mb-1.5 block">Display Name</label>
                <input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </div>
              <div>
                <label className="label mb-1.5 block">Username</label>
                <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="off" />
              </div>
              <div>
                <label className="label mb-1.5 block">Temporary Password</label>
                <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
                <p className="mt-1 text-xs text-ink-muted">Minimum 8 characters.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" disabled={busy || !displayName || username.length < 3 || password.length < 8} onClick={createJudge}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create Judge
              </button>
            </div>
          </div>
        </div>
      )}

      {message && <div className="card fixed right-6 top-6 z-50 px-4 py-3 text-sm shadow-soft-md">{message}</div>}
    </div>
  );
}

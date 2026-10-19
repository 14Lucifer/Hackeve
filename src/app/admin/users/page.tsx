'use client';
import { useEffect, useRef, useState } from 'react';
import { Upload, Plus, Lock, Unlock, Trash2, Search, X, Loader2 } from 'lucide-react';

type User = { id: string; email: string; locked: boolean; createdAt: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/admin/users');
    const j = await r.json();
    setUsers(j.users);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));
  const allChecked = filtered.length > 0 && filtered.every((u) => selected.has(u.id));

  function toggle(id: string) {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  }
  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map((u) => u.id)));
  }

  async function bulk(action: 'lock' | 'unlock' | 'delete') {
    if (selected.size === 0) return;
    if (action === 'delete' && !confirm(`Delete ${selected.size} user(s)? This also deletes their submissions.`)) return;
    setBusy(true);
    const r = await fetch('/api/admin/users/bulk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected), action }),
    });
    if (r.ok) {
      setToast(`${action === 'delete' ? 'Deleted' : action === 'lock' ? 'Locked' : 'Unlocked'} ${selected.size} user(s).`);
      setSelected(new Set());
      await load();
    }
    setBusy(false);
  }

  async function addOne() {
    if (!newEmail.trim()) return;
    setBusy(true);
    const r = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
    });
    const j = await r.json();
    if (r.ok) { setNewEmail(''); setShowAdd(false); setToast('User added.'); await load(); }
    else setToast(j.error || 'Failed');
    setBusy(false);
  }

  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('file', f);
    const r = await fetch('/api/admin/users/import', { method: 'POST', body: fd });
    const j = await r.json();
    if (r.ok) setToast(`Imported ${j.imported}, skipped ${j.skipped}, errors ${j.errors.length}.`);
    else setToast(j.error || 'Import failed');
    setBusy(false);
    e.target.value = '';
    await load();
  }

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Participants</h1>
          <p className="text-sm text-ink-muted mt-1">Manage registered participant emails.</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCsv} />
          <button onClick={() => fileRef.current?.click()} className="btn-secondary" disabled={busy}>
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      <div className="card">
        <div className="p-4 flex items-center justify-between border-b border-line">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input className="input pl-9" placeholder="Search emails..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-sm text-ink-muted">{selected.size} selected</span>
              <button onClick={() => bulk('lock')} className="btn-secondary h-9 text-sm" disabled={busy}>
                <Lock className="h-4 w-4" /> Lock
              </button>
              <button onClick={() => bulk('unlock')} className="btn-secondary h-9 text-sm" disabled={busy}>
                <Unlock className="h-4 w-4" /> Unlock
              </button>
              <button onClick={() => bulk('delete')} className="btn-danger h-9 text-sm" disabled={busy}>
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-ink-muted"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">
            {search ? 'No users match your search.' : 'No users yet. Import a CSV or add one manually.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-muted">
                <th className="px-4 py-2.5 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-brand" />
                </th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Added</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0 table-row-hover">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} className="accent-brand" />
                  </td>
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.locked ? <span className="badge-danger">Locked</span> : <span className="badge-success">Active</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <RowActions user={u} onDone={load} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold tracking-tight">Add User</h2>
              <button onClick={() => setShowAdd(false)} className="text-ink-muted hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
            <label className="label block mb-1.5">Email</label>
            <input className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="participant@example.com" />
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
              <button onClick={addOne} className="btn-primary" disabled={busy}>Add</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 right-6 card px-4 py-3 text-sm animate-fade-in z-50 shadow-soft-md">{toast}</div>
      )}
    </div>
  );
}

function RowActions({ user, onDone }: { user: User; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function act(action: 'lock' | 'unlock' | 'delete') {
    if (action === 'delete' && !confirm(`Delete ${user.email}?`)) return;
    setBusy(true);
    await fetch(`/api/admin/users/${user.id}`, {
      method: action === 'delete' ? 'DELETE' : 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: action === 'delete' ? undefined : JSON.stringify({ locked: action === 'lock' }),
    });
    setBusy(false);
    onDone();
  }
  return (
    <div className="flex items-center gap-1 justify-end">
      {user.locked ? (
        <button onClick={() => act('unlock')} className="btn-ghost h-8 text-xs" disabled={busy}><Unlock className="h-3.5 w-3.5" /></button>
      ) : (
        <button onClick={() => act('lock')} className="btn-ghost h-8 text-xs" disabled={busy}><Lock className="h-3.5 w-3.5" /></button>
      )}
      <button onClick={() => act('delete')} className="btn-ghost h-8 text-xs text-red-600 hover:bg-red-50" disabled={busy}>
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

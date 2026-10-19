'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandHeader } from '@/components/BrandHeader';
import { Loader2 } from 'lucide-react';
import type { Branding } from '@/lib/branding';

export function LoginForm({ branding }: { branding: Branding }) {
  const [tab, setTab] = useState<'participant' | 'judge' | 'admin'>('participant');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === 'participant') {
        const r = await fetch('/api/auth/participant', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Login failed');
        router.push('/dashboard');
      } else {
        const r = await fetch(`/api/auth/${tab}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Login failed');
        router.push(tab === 'judge' ? '/judge' : '/admin');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <BrandHeader branding={branding} className="mb-10" />
      <div className="w-full max-w-md card p-8 animate-fade-in">
        <h1 className="text-xl font-semibold tracking-tight">Welcome</h1>
        <p className="text-sm text-ink-muted mt-1">Sign in to continue to the submission portal.</p>

        <div className="mt-6 flex p-1 bg-bg-subtle rounded-lg border border-line">
          {(['participant', 'judge', 'admin'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 h-9 text-sm font-medium rounded-md transition ${
                tab === t ? 'bg-white text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t === 'participant' ? 'Participant' : t === 'judge' ? 'Judge' : 'Admin'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {tab === 'participant' ? (
            <div>
              <label className="label block mb-1.5">Registered Email</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          ) : (
            <>
              <div>
                <label className="label block mb-1.5">Username</label>
                <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div>
                <label className="label block mb-1.5">Password</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </>
          )}

          {error && (
            <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue
          </button>
        </form>
      </div>
      <p className="mt-8 text-xs text-ink-subtle">
        © {new Date().getFullYear()} {[branding.organizerName, branding.eventName].filter(Boolean).join(' · ')}
      </p>
    </main>
  );
}

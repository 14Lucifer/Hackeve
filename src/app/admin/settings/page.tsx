'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { BrandHeader } from '@/components/BrandHeader';

export default function SettingsPage() {
  const router = useRouter();
  const logoInput = useRef<HTMLInputElement>(null);
  const [eventName, setEventName] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string>('');
  const [judgingDeadline, setJudgingDeadline] = useState<string>('');
  const [rankingsPublished, setRankingsPublished] = useState(false);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings').then((r) => r.json()).then((j) => {
      setEventName(j.eventName || '');
      setOrganizerName(j.organizerName || '');
      setLogoUrl(j.logoUrl || null);
      setDeadline(j.deadline ? toLocalInput(new Date(j.deadline)) : '');
      setJudgingDeadline(j.judgingDeadline ? toLocalInput(new Date(j.judgingDeadline)) : '');
      setRankingsPublished(Boolean(j.rankingsPublished));
      setUsername(j.username || '');
      setNewUsername(j.username || '');
    });
  }, []);

  function toLocalInput(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function saveBranding() {
    setBusy(true);
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ eventName, organizerName }),
    });
    const data = await response.json();
    setToast(response.ok ? 'Branding saved.' : data.error);
    if (response.ok) router.refresh();
    setBusy(false);
  }

  async function uploadLogo(file: File) {
    setBusy(true);
    const form = new FormData();
    form.append('file', file);
    const response = await fetch('/api/admin/branding/logo', { method: 'POST', body: form });
    const data = await response.json();
    if (response.ok) {
      setLogoUrl(data.logoUrl);
      setToast('Logo uploaded.');
      router.refresh();
    } else setToast(data.error);
    if (logoInput.current) logoInput.current.value = '';
    setBusy(false);
  }

  async function removeLogo() {
    setBusy(true);
    const response = await fetch('/api/admin/branding/logo', { method: 'DELETE' });
    if (response.ok) {
      setLogoUrl(null);
      setToast('Logo removed.');
      router.refresh();
    } else setToast('Could not remove logo.');
    setBusy(false);
  }

  async function saveDeadline() {
    setBusy(true);
    const r = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deadline: deadline ? new Date(deadline).toISOString() : null }),
    });
    const j = await r.json();
    setToast(r.ok ? 'Deadline saved.' : j.error);
    setBusy(false);
  }

  async function saveJudgingSettings() {
    setBusy(true);
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        judgingDeadline: judgingDeadline ? new Date(judgingDeadline).toISOString() : null,
        rankingsPublished,
      }),
    });
    const data = await response.json();
    setToast(response.ok ? 'Judging settings saved.' : data.error);
    setBusy(false);
  }

  async function saveCreds() {
    setBusy(true);
    const r = await fetch('/api/admin/settings/credentials', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword, newUsername, newPassword }),
    });
    const j = await r.json();
    if (r.ok) {
      setToast('Credentials updated.');
      setCurrentPassword(''); setNewPassword('');
      setUsername(newUsername);
    } else setToast(j.error);
    setBusy(false);
  }

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
  }, [toast]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-ink-muted mb-8">Configure branding, submission, judging, rankings, and admin credentials.</p>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Event Branding</h2>
        <p className="text-sm text-ink-muted mt-1 mb-4">
          Shown on the login page, page headers, and browser tab.
        </p>
        <div className="space-y-4">
          <div>
            <label className="label block mb-1.5">Event Name</label>
            <input className="input max-w-sm" placeholder="AI Hackathon" maxLength={120} value={eventName} onChange={(e) => setEventName(e.target.value)} />
          </div>
          <div>
            <label className="label block mb-1.5">Organizers (optional)</label>
            <input className="input max-w-sm" placeholder="Company A · Company B" maxLength={160} value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} />
          </div>
          <div>
            <label className="label block mb-1.5">Event Logo (optional)</label>
            <p className="text-xs text-ink-muted mb-2">PNG, JPG, WEBP, GIF, or SVG, up to 2 MB. A wide image with transparent background works best.</p>
            <input
              ref={logoInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadLogo(file); }}
            />
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => logoInput.current?.click()} disabled={busy}>
                <Upload className="h-4 w-4" />{logoUrl ? 'Replace Logo' : 'Upload Logo'}
              </button>
              {logoUrl && (
                <button className="btn-secondary" onClick={removeLogo} disabled={busy}>
                  <Trash2 className="h-4 w-4" />Remove
                </button>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-bg-subtle p-6">
            <p className="label mb-4">Preview</p>
            <BrandHeader branding={{ eventName: eventName || 'Event name', organizerName, logoUrl }} />
          </div>
        </div>
        <div className="mt-5">
          <button className="btn-primary" onClick={saveBranding} disabled={busy || !eventName.trim()}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}Save Branding
          </button>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Submission Deadline</h2>
        <p className="text-sm text-ink-muted mt-1 mb-4">
          Participants can submit until this time. Shown as your local time; stored in UTC.
        </p>
        <label className="label block mb-1.5">Deadline</label>
        <input type="datetime-local" className="input max-w-sm" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <div className="mt-5 flex gap-2">
          <button className="btn-primary" onClick={saveDeadline} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}Save Deadline
          </button>
          {deadline && (
            <button className="btn-secondary" onClick={() => setDeadline('')} disabled={busy}>Clear</button>
          )}
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Judging</h2>
        <p className="text-sm text-ink-muted mt-1 mb-4">
          Judges can edit scores until this deadline. Publish rankings when results are ready.
        </p>
        <label className="label block mb-1.5">Judging Deadline</label>
        <input
          type="datetime-local"
          className="input max-w-sm"
          value={judgingDeadline}
          onChange={(event) => setJudgingDeadline(event.target.value)}
        />
        <label className="mt-5 flex max-w-sm items-center justify-between rounded-lg border border-line p-3 text-sm">
          <span>
            <span className="block font-medium">Publish rankings</span>
            <span className="text-xs text-ink-muted">Allow judges to view the overall result.</span>
          </span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand"
            checked={rankingsPublished}
            onChange={(event) => setRankingsPublished(event.target.checked)}
          />
        </label>
        <div className="mt-5">
          <button className="btn-primary" onClick={saveJudgingSettings} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}Save Judging Settings
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Admin Credentials</h2>
        <p className="text-sm text-ink-muted mt-1 mb-4">
          Change your username and/or password. Enter current password to confirm.
        </p>
        <div className="space-y-4">
          <div>
            <label className="label block mb-1.5">Current Password</label>
            <input className="input max-w-sm" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="label block mb-1.5">New Username</label>
            <input className="input max-w-sm" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
          </div>
          <div>
            <label className="label block mb-1.5">New Password (leave blank to keep)</label>
            <input className="input max-w-sm" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </div>
        <div className="mt-5">
          <button className="btn-primary" onClick={saveCreds} disabled={busy || !currentPassword}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}Update Credentials
          </button>
        </div>
      </div>

      {toast && <div className="fixed top-6 right-6 card px-4 py-3 text-sm animate-fade-in z-50 shadow-soft-md">{toast}</div>}
    </div>
  );
}

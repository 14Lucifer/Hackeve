import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth';
import { BrandHeaderInline } from '@/components/BrandHeader';
import { LogoutButton } from '@/components/LogoutButton';
import { LayoutDashboard, Users, FolderOpen, Settings, Gavel, Star, Trophy } from 'lucide-react';
import { AdminNavItem } from '@/components/AdminNav';
import { getBranding } from '@/lib/branding';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await readSession();
  if (!s || s.role !== 'admin') redirect('/login');
  const branding = await getBranding();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-white border-r border-line flex flex-col">
        <div className="p-5 border-b border-line">
          <BrandHeaderInline branding={branding} />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <AdminNavItem href="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" exact />
          <AdminNavItem href="/admin/users" icon={<Users className="h-4 w-4" />} label="Participants" />
          <AdminNavItem href="/admin/submissions" icon={<FolderOpen className="h-4 w-4" />} label="Submissions" />
          <AdminNavItem href="/admin/finalists" icon={<Star className="h-4 w-4" />} label="Finalists" />
          <AdminNavItem href="/admin/judges" icon={<Gavel className="h-4 w-4" />} label="Judges" />
          <AdminNavItem href="/admin/rankings" icon={<Trophy className="h-4 w-4" />} label="Rankings" />
          <AdminNavItem href="/admin/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
        </nav>
        <div className="p-3 border-t border-line">
          <div className="text-xs text-ink-muted px-2 pb-2">Signed in as <span className="text-ink font-medium">{s.username}</span></div>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 bg-bg-subtle">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth';
import { BrandHeaderInline } from '@/components/BrandHeader';
import { JudgeNav } from '@/components/JudgeNav';
import { LogoutButton } from '@/components/LogoutButton';
import { getBranding } from '@/lib/branding';

export default async function JudgeLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  if (!session || session.role !== 'judge') redirect('/login');
  const branding = await getBranding();

  return (
    <div className="min-h-screen bg-bg-subtle">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <BrandHeaderInline branding={branding} className="min-w-0" />
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-medium">{session.displayName}</p>
                <p className="text-xs text-ink-muted">Judge</p>
              </div>
              <div className="w-32"><LogoutButton /></div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 sm:mt-2 sm:border-0 sm:pt-0">
            <JudgeNav />
            <div className="w-28 shrink-0 sm:hidden"><LogoutButton /></div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

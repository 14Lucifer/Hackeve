import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth';
import { BrandHeaderInline } from '@/components/BrandHeader';
import { LogoutButton } from '@/components/LogoutButton';
import { prisma } from '@/lib/db';
import { CountdownInline } from '@/components/Countdown';
import { getBranding } from '@/lib/branding';

export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const s = await readSession();
  if (!s || s.role !== 'participant') redirect('/login');
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const branding = await getBranding();

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-line sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandHeaderInline branding={branding} />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="label">Deadline</span>
              <CountdownInline deadline={settings?.deadline?.toISOString() || null} />
            </div>
            <span className="hidden md:inline text-sm text-ink-muted border-l border-line pl-4">{s.email}</span>
            <div className="w-32 shrink-0"><LogoutButton /></div>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}

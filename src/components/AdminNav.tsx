'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/util';

export function AdminNavItem({ href, icon, label, exact }: { href: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 h-9 px-2.5 rounded-md text-sm font-medium transition relative',
        active ? 'bg-brand-soft text-brand-700' : 'text-ink-muted hover:bg-bg-subtle hover:text-ink'
      )}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand" />}
      {icon}
      {label}
    </Link>
  );
}

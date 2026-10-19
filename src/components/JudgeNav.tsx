'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderOpen, Trophy } from 'lucide-react';
import { cn } from '@/lib/util';

const items = [
  { href: '/judge', label: 'Finalists', icon: FolderOpen, exact: true },
  { href: '/judge/rankings', label: 'Rankings', icon: Trophy, exact: false },
];

export function JudgeNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = item.exact ? path === item.href || path.startsWith('/judge/projects/') : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition',
              active ? 'bg-brand-soft text-brand-700' : 'text-ink-muted hover:bg-bg-subtle hover:text-ink'
            )}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

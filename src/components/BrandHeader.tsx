'use client';

import { useState } from 'react';
import { cn } from '@/lib/util';
import type { Branding } from '@/lib/branding';

function BrandLogo({ branding, compact }: { branding: Branding; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const text = branding.organizerName || branding.eventName;

  if (!branding.logoUrl || failed) {
    return (
      <span className={cn('font-semibold tracking-tight text-ink', compact ? 'truncate text-sm' : 'text-center text-lg')}>
        {text}
      </span>
    );
  }

  return (
    <img
      src={branding.logoUrl}
      alt={text}
      className={cn(
        'w-auto object-contain',
        compact ? 'h-12 max-w-[15rem]' : 'h-20 max-w-full sm:h-24'
      )}
      onError={() => setFailed(true)}
    />
  );
}

function hasSeparateEventLine(branding: Branding) {
  return Boolean(branding.logoUrl || branding.organizerName);
}

export function BrandHeader({ branding, className }: { branding: Branding; className?: string }) {
  const subtitle = branding.logoUrl && branding.organizerName
    ? `${branding.organizerName} — ${branding.eventName}`
    : branding.eventName;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <BrandLogo branding={branding} />
      {hasSeparateEventLine(branding) && (
        <p className="text-center text-xs font-medium text-ink-muted">{subtitle}</p>
      )}
    </div>
  );
}

export function BrandHeaderInline({ branding, className }: { branding: Branding; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <BrandLogo branding={branding} compact />
      {hasSeparateEventLine(branding) && (
        <span className="hidden truncate text-xs font-medium text-ink-muted lg:inline">{branding.eventName}</span>
      )}
    </div>
  );
}

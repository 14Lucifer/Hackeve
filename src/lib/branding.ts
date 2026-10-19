import { prisma } from './db';

export type Branding = {
  eventName: string;
  organizerName: string;
  logoUrl: string | null;
};

export const DEFAULT_EVENT_NAME = 'Hackathon Submission Portal';

export const LOGO_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export async function getBranding(): Promise<Branding> {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    return {
      eventName: settings?.eventName || DEFAULT_EVENT_NAME,
      organizerName: settings?.organizerName || '',
      logoUrl: settings?.logoPath ? `/api/branding/logo?v=${encodeURIComponent(settings.logoPath)}` : null,
    };
  } catch {
    return { eventName: DEFAULT_EVENT_NAME, organizerName: '', logoUrl: null };
  }
}

export function brandingTitle(branding: Branding) {
  return branding.organizerName ? `${branding.organizerName} — ${branding.eventName}` : branding.eventName;
}

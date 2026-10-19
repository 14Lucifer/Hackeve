import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...i: ClassValue[]) { return twMerge(clsx(i)); }

export function sanitize(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9\-_. ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'untitled';
}

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export const LIMITS = {
  summary:   25 * 1024 * 1024,
  screenshot:10 * 1024 * 1024,
  video:  2_000_000_000,
  maxScreenshots: 20,
};

export const ACCEPT = {
  summary: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'application/markdown',
    'application/zip',
  ],
  screenshot: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'],
};

export const ACCEPT_EXTENSIONS = {
  summary: ['.pdf', '.doc', '.docx', '.txt', '.md', '.markdown', '.zip'],
  screenshot: ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
  video: ['.mp4', '.mov', '.webm', '.mkv'],
};

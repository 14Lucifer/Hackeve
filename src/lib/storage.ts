import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function saveFile(submissionId: string, kind: string, file: File) {
  const subDir = path.join(UPLOAD_DIR, submissionId, kind);
  ensureDir(subDir);
  const id = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(file.name).slice(0, 10);
  const fileName = `${id}${ext}`;
  const full = path.join(subDir, fileName);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(full, buf);
  return {
    storagePath: path.relative(UPLOAD_DIR, full),
    size: buf.length,
  };
}

export function createTempUploadPath(submissionId: string) {
  const dir = path.join(UPLOAD_DIR, submissionId, '.tmp');
  ensureDir(dir);
  return path.join(dir, crypto.randomBytes(12).toString('hex'));
}

export async function commitTempUpload(tempPath: string, submissionId: string, kind: string, originalName: string) {
  const dir = path.join(UPLOAD_DIR, submissionId, kind);
  ensureDir(dir);
  const extension = path.extname(originalName).slice(0, 10);
  const destination = path.join(dir, `${crypto.randomBytes(8).toString('hex')}${extension}`);
  await fs.promises.rename(tempPath, destination);
  return path.relative(UPLOAD_DIR, destination);
}

export function removeTempUpload(tempPath: string) {
  try { fs.unlinkSync(tempPath); } catch {}
}

export function absPath(storagePath: string) {
  return path.join(UPLOAD_DIR, storagePath);
}

export function removeFile(storagePath: string) {
  const p = absPath(storagePath);
  try { fs.unlinkSync(p); } catch {}
}

import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

function resolveStorageRoot() {
  const config = useRuntimeConfig();
  const configuredPath = String(config.mediaStorageDir || 'storage/media').trim() || 'storage/media';
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

function resolveStoragePath(storageKey: string) {
  const root = resolveStorageRoot();
  const normalizedKey = storageKey.replace(/\\/g, '/');
  const fullPath = path.resolve(root, normalizedKey);

  if (!fullPath.startsWith(`${root}${path.sep}`) && fullPath !== root) {
    throw createError({
      statusCode: 400,
      statusMessage: '媒体路径无效',
    });
  }

  return fullPath;
}

export function createMediaStorageKey(extension: string) {
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}/${month}/${randomUUID()}.${safeExtension}`;
}

export async function ensureMediaStorageDirectory() {
  await fs.mkdir(resolveStorageRoot(), {
    recursive: true,
  });
}

export async function writeMediaStorageFile(storageKey: string, data: Buffer) {
  const fullPath = resolveStoragePath(storageKey);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, data);
}

export async function readMediaStorageFile(storageKey: string) {
  const fullPath = resolveStoragePath(storageKey);
  return await fs.readFile(fullPath);
}

export async function deleteMediaStorageFile(storageKey: string) {
  const fullPath = resolveStoragePath(storageKey);
  try {
    await fs.unlink(fullPath);
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }

    throw error;
  }
}

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { AdminModuleStateStore } from '../../shared/types/module-center';

export const MODULE_CENTER_STATE_FILE_PATH = resolve(process.cwd(), '.data/module-center/state.json');

function normalizeModuleStateStore(input: unknown): AdminModuleStateStore {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const entries = Object.entries(input as Record<string, unknown>).flatMap(([key, value]) => {
    if (!value || typeof value !== 'object') {
      return [];
    }

    const record = value as Record<string, unknown>;
    const installedAt = typeof record.installedAt === 'string' && record.installedAt.trim()
      ? record.installedAt
      : null;
    const updatedAt = typeof record.updatedAt === 'string' && record.updatedAt.trim()
      ? record.updatedAt
      : null;

    return [[key, {
      installed: Boolean(record.installed),
      enabled: Boolean(record.enabled),
      installedAt,
      updatedAt,
    }] as const];
  });

  return Object.fromEntries(entries);
}

export async function readModuleStateStore(): Promise<AdminModuleStateStore> {
  try {
    const raw = await readFile(MODULE_CENTER_STATE_FILE_PATH, 'utf8');
    return normalizeModuleStateStore(JSON.parse(raw));
  }
  catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as NodeJS.ErrnoException).code) : '';

    if (code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

export async function writeModuleStateStore(store: AdminModuleStateStore) {
  await mkdir(dirname(MODULE_CENTER_STATE_FILE_PATH), { recursive: true });
  await writeFile(MODULE_CENTER_STATE_FILE_PATH, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

import { randomUUID } from 'node:crypto';

export const MISSING_SESSION_PASSWORD_PREFIX = '__blog2_missing_session_password__:';
export const MISSING_SESSION_PASSWORD_MESSAGE = '缺少 NUXT_SESSION_PASSWORD 环境变量';
export const SESSION_PASSWORD_MIN_LENGTH_MESSAGE = 'NUXT_SESSION_PASSWORD 至少需要 32 个字符';
const SESSION_PASSWORD_MIN_LENGTH = 32;

export function isMissingSessionPasswordPlaceholder(value: string | null | undefined) {
  return String(value || '').startsWith(MISSING_SESSION_PASSWORD_PREFIX);
}

export function resolveSessionPasswordRuntimeValue(value: string | null | undefined) {
  const normalizedValue = String(value || '').trim();

  if (normalizedValue) {
    return normalizedValue;
  }

  return `${MISSING_SESSION_PASSWORD_PREFIX}${randomUUID()}`;
}

export function assertValidSessionPassword(value: string | null | undefined) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue || isMissingSessionPasswordPlaceholder(normalizedValue)) {
    throw new Error(MISSING_SESSION_PASSWORD_MESSAGE);
  }

  if (normalizedValue.length < SESSION_PASSWORD_MIN_LENGTH) {
    throw new Error(SESSION_PASSWORD_MIN_LENGTH_MESSAGE);
  }

  return normalizedValue;
}

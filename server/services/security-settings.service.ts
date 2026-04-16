import { createError } from 'h3';
import {
  cloneSecuritySettings,
  cloneSiteSecuritySettings,
  DEFAULT_SECURITY_SETTINGS as SHARED_DEFAULT_SECURITY_SETTINGS,
  DEFAULT_SITE_SECURITY_SETTINGS,
} from '../../shared/constants/security';
import type {
  LoginSecuritySettings,
  SecurityPublicConfig,
  SecurityRateLimitSettings,
  SecuritySettings,
  SiteSecuritySettings,
} from '../../shared/types/security';

export const DEFAULT_SECURITY_SETTINGS = cloneSecuritySettings(SHARED_DEFAULT_SECURITY_SETTINGS);

function toSafeInteger(value: unknown, fallbackValue: number, minimum = 1, maximum = 86_400) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallbackValue;
  }

  const integerValue = Math.trunc(numericValue);
  if (integerValue < minimum || integerValue > maximum) {
    return fallbackValue;
  }

  return integerValue;
}

function normalizeRateLimitSettings(
  input: Partial<SecurityRateLimitSettings> | null | undefined,
  fallbackValue: SecurityRateLimitSettings,
): SecurityRateLimitSettings {
  return {
    windowSeconds: toSafeInteger(input?.windowSeconds, fallbackValue.windowSeconds),
    maxPerIp: toSafeInteger(input?.maxPerIp, fallbackValue.maxPerIp, 1, 10_000),
    maxPerSession: toSafeInteger(input?.maxPerSession, fallbackValue.maxPerSession, 1, 10_000),
  };
}

export function normalizeSecuritySettings(input?: Partial<SecuritySettings> | null): SecuritySettings {
  const base = cloneSecuritySettings(DEFAULT_SECURITY_SETTINGS);

  return {
    login: {
      captchaEnabled: Boolean(input?.login?.captchaEnabled),
      rateLimit: normalizeRateLimitSettings(input?.login?.rateLimit, base.login.rateLimit),
      maxFailures: toSafeInteger(input?.login?.maxFailures, base.login.maxFailures, 1, 100),
      cooldownSeconds: toSafeInteger(input?.login?.cooldownSeconds, base.login.cooldownSeconds, 1, 86_400),
    },
    comments: {
      captchaEnabled: Boolean(input?.comments?.captchaEnabled),
      rateLimit: normalizeRateLimitSettings(input?.comments?.rateLimit, base.comments.rateLimit),
    },
    guestbook: {
      captchaEnabled: Boolean(input?.guestbook?.captchaEnabled),
      rateLimit: normalizeRateLimitSettings(input?.guestbook?.rateLimit, base.guestbook.rateLimit),
    },
    linkApplications: {
      captchaEnabled: Boolean(input?.linkApplications?.captchaEnabled),
      rateLimit: normalizeRateLimitSettings(input?.linkApplications?.rateLimit, base.linkApplications.rateLimit),
    },
    likes: {
      rateLimit: normalizeRateLimitSettings(input?.likes?.rateLimit, base.likes.rateLimit),
    },
  };
}

export function normalizeSiteSecuritySettings(input?: Partial<SiteSecuritySettings> | null): SiteSecuritySettings {
  return {
    ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS),
    turnstileSiteKey: typeof input?.turnstileSiteKey === 'string' ? input.turnstileSiteKey.trim() : '',
    ...normalizeSecuritySettings(input),
  };
}

function assertRateLimitSettings(scopeName: string, input: SecurityRateLimitSettings) {
  if (input.maxPerSession > input.maxPerIp) {
    throw createError({
      statusCode: 400,
      statusMessage: `${scopeName}的会话次数上限不能大于 IP 次数上限`,
    });
  }
}

export function validateSecuritySettings(input: SiteSecuritySettings) {
  const captchaEnabled = input.login.captchaEnabled
    || input.comments.captchaEnabled
    || input.guestbook.captchaEnabled
    || input.linkApplications.captchaEnabled;

  if (captchaEnabled && !input.turnstileSiteKey.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: '启用人机校验时必须填写 Turnstile Site Key',
    });
  }

  assertRateLimitSettings('登录限流', input.login.rateLimit);
  assertRateLimitSettings('评论限流', input.comments.rateLimit);
  assertRateLimitSettings('留言限流', input.guestbook.rateLimit);
  assertRateLimitSettings('友链申请限流', input.linkApplications.rateLimit);
  assertRateLimitSettings('点赞限流', input.likes.rateLimit);
}

export function toSecurityRateLimitPolicy(input: SecurityRateLimitSettings) {
  return {
    windowMs: input.windowSeconds * 1000,
    limits: {
      ip: input.maxPerIp,
      session: input.maxPerSession,
    },
  };
}

export function toLoginFailureSettings(input: LoginSecuritySettings) {
  return {
    windowMs: input.rateLimit.windowSeconds * 1000,
    cooldownMs: input.cooldownSeconds * 1000,
    maxFailures: input.maxFailures,
  };
}

export function buildPublicSecurityConfig(input: {
  turnstileSiteKey?: string | null;
  security?: Partial<SecuritySettings> | null;
}): SecurityPublicConfig {
  const normalizedSettings = normalizeSecuritySettings(input.security);

  return {
    turnstileSiteKey: input.turnstileSiteKey?.trim() || '',
    loginCaptchaEnabled: normalizedSettings.login.captchaEnabled,
    commentCaptchaEnabled: normalizedSettings.comments.captchaEnabled,
    guestbookCaptchaEnabled: normalizedSettings.guestbook.captchaEnabled,
    linkApplicationCaptchaEnabled: normalizedSettings.linkApplications.captchaEnabled,
  };
}

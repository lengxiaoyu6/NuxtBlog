import { cloneSiteSettings, DEFAULT_SITE_SETTINGS } from '../../app/constants/site-settings';
import type {
  AdminSettingsForm,
  SiteNotificationSettings,
} from '../../app/types/admin-settings';
import { readSiteSettingsRecord, upsertSiteSettingsRecord } from '../repositories/site-settings.repository';
import {
  buildPublicSecurityConfig,
  normalizeSiteSecuritySettings,
  validateSecuritySettings,
} from './security-settings.service';
import { normalizeNotificationSettings } from './notification-settings.shared';
import { ensureSeedPageSettings } from './page-settings.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createRequestError(statusCode: number, statusMessage: string) {
  if (typeof globalThis.createError === 'function') {
    return globalThis.createError({ statusCode, statusMessage });
  }

  return Object.assign(new Error(statusMessage), {
    statusCode,
    statusMessage,
  });
}

function isValidAbsoluteUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  }
  catch {
    return false;
  }
}

function normalizeSiteSettings(input: AdminSettingsForm) {
  return {
    ...cloneSiteSettings(input),
    socialLinks: input.socialLinks.map((item, index) => ({
      ...item,
      order: index + 1,
    })),
    navItems: input.navItems.map((item, index) => ({
      ...item,
      order: index + 1,
    })),
    security: normalizeSiteSecuritySettings(input.security),
    notification: normalizeNotificationSettings(input.notification, {
      passwordConfigured: input.notification.smtp.passwordConfigured,
    }),
  } satisfies AdminSettingsForm;
}

function ensureTextMaxLength(value: string, maxLength: number, message: string) {
  if (value.trim().length > maxLength) {
    throw createRequestError(400, message);
  }
}

function validateSiteSettings(input: AdminSettingsForm) {
  if (!input.site.name.trim()) {
    throw createRequestError(400, '请输入站点名称');
  }

  if (!input.site.url.trim() || !isValidAbsoluteUrl(input.site.url.trim())) {
    throw createRequestError(400, '请输入有效的站点链接');
  }

  ensureTextMaxLength(input.site.description, 160, '站点简介需控制在 160 个字符以内');

  if (!input.owner.name.trim()) {
    throw createRequestError(400, '请输入站长昵称');
  }

  if (!input.owner.location.trim()) {
    throw createRequestError(400, '请输入所在地点');
  }

  if (!input.owner.tagline.trim()) {
    throw createRequestError(400, '请输入身份短句');
  }

  ensureTextMaxLength(input.owner.bio, 180, '个人简介需控制在 180 个字符以内');

  if (!EMAIL_PATTERN.test(input.footer.contactEmail.trim())) {
    throw createRequestError(400, '请输入有效的联系邮箱');
  }

  if (!input.footer.copyright.trim()) {
    throw createRequestError(400, '请输入版权文案');
  }

  if (!input.footer.icpText.trim()) {
    throw createRequestError(400, '请输入备案号文本');
  }

  if (!input.footer.icpLink.trim() || !isValidAbsoluteUrl(input.footer.icpLink.trim())) {
    throw createRequestError(400, '请输入有效的备案链接');
  }

  ensureTextMaxLength(input.footer.note, 140, '补充说明需控制在 140 个字符以内');
  validateSecuritySettings(input.security);
}

function toSiteSettingsForm(record: NonNullable<Awaited<ReturnType<typeof readSiteSettingsRecord>>>) {
  const persistedNotification = record.notificationSettingsJson && typeof record.notificationSettingsJson === 'object'
    ? record.notificationSettingsJson
    : null;

  return {
    site: {
      name: record.siteName,
      url: record.siteUrl,
      description: record.siteDescription,
      logoUrl: record.siteLogoUrl ?? '',
      logoAlt: record.siteLogoAlt,
    },
    owner: {
      name: record.ownerName,
      avatarUrl: record.ownerAvatarUrl ?? '',
      bio: record.ownerBio,
      location: record.ownerLocation ?? '',
      tagline: record.ownerTagline ?? '',
    },
    socialLinks: record.socialLinks.map((item) => ({
      id: item.id,
      label: item.label,
      url: item.url,
      icon: item.icon,
      enabled: item.enabled,
      order: item.sortOrder,
    })),
    navItems: record.navItems.map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      openInNewTab: item.openInNewTab,
      enabled: item.enabled,
      order: item.sortOrder,
    })),
    footer: {
      contactEmail: record.contactEmail,
      copyright: record.footerCopyright,
      icpText: record.footerIcpText ?? '',
      icpLink: record.footerIcpLink ?? '',
      note: record.footerNote ?? '',
    },
    security: normalizeSiteSecuritySettings({
      turnstileSiteKey: record.turnstileSiteKey ?? '',
      ...(record.securitySettingsJson && typeof record.securitySettingsJson === 'object' ? record.securitySettingsJson : {}),
    }),
    notification: normalizeNotificationSettings(persistedNotification as Partial<SiteNotificationSettings> | null, {
      passwordConfigured: Boolean(record.notificationSecretsCiphertext),
    }),
  } satisfies AdminSettingsForm;
}

export async function ensureSeedSiteConfiguration() {
  const existingRecord = await readSiteSettingsRecord();

  if (!existingRecord) {
    await upsertSiteSettingsRecord(cloneSiteSettings(DEFAULT_SITE_SETTINGS));
  }

  await ensureSeedPageSettings();
}

export async function readSiteSettings() {
  await ensureSeedSiteConfiguration();
  const record = await readSiteSettingsRecord();

  if (!record) {
    return cloneSiteSettings(DEFAULT_SITE_SETTINGS);
  }

  return toSiteSettingsForm(record);
}

export async function readSiteSecuritySettings() {
  const settings = await readSiteSettings();
  return settings.security;
}

export async function readNotificationSettings() {
  const { readNotificationModuleRuntimeSettings } = await import('./notification-module.service');
  return await readNotificationModuleRuntimeSettings();
}

export async function readPublicSiteSettings() {
  const settings = await readSiteSettings();

  return {
    ...settings,
    socialLinks: settings.socialLinks.filter((item) => item.enabled && item.url.trim()),
    navItems: settings.navItems.filter((item) => item.enabled && item.href.trim()),
  } satisfies AdminSettingsForm;
}

export async function readPublicSecurityConfig() {
  const settings = await readSiteSettings();
  return buildPublicSecurityConfig({
    turnstileSiteKey: settings.security.turnstileSiteKey,
    security: settings.security,
  });
}

export async function saveSiteSettings(input: AdminSettingsForm) {
  const normalizedInput = normalizeSiteSettings(input);
  validateSiteSettings(normalizedInput);

  const savedRecord = await upsertSiteSettingsRecord(normalizedInput);
  return toSiteSettingsForm(savedRecord);
}

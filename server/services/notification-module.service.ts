import type { Prisma } from '@prisma/client';
import { cloneSiteSettings, DEFAULT_SITE_SETTINGS } from '../../app/constants/site-settings';
import type { SiteNotificationSettings } from '../../app/types/admin-settings';
import {
  readSiteSettingsRecord,
  updateNotificationModuleSettingsRecord,
} from '../repositories/site-settings.repository';
import { decryptNotificationSecrets, encryptNotificationSecrets } from '../utils/notification-secret';
import { ensureSeedSiteConfiguration } from './site-settings.service';
import {
  normalizeNotificationSettings,
  validateNotificationSettings,
} from './notification-settings.shared';

function resolvePersistedNotificationInput(record: Awaited<ReturnType<typeof readSiteSettingsRecord>>) {
  if (!record?.notificationSettingsJson || typeof record.notificationSettingsJson !== 'object') {
    return null;
  }

  return record.notificationSettingsJson as Partial<SiteNotificationSettings>;
}

function toNotificationModuleSettingsJson(input: SiteNotificationSettings) {
  return {
    enabled: input.enabled,
    subjectPrefix: input.subjectPrefix,
    adminRecipients: input.adminRecipients,
    smtp: {
      host: input.smtp.host,
      port: input.smtp.port,
      secure: input.smtp.secure,
      username: input.smtp.username,
      fromName: input.smtp.fromName,
      fromEmail: input.smtp.fromEmail,
      replyToEmail: input.smtp.replyToEmail,
    },
    events: {
      postCommentCreated: input.events.postCommentCreated,
      postCommentReply: input.events.postCommentReply,
      guestbookCreated: input.events.guestbookCreated,
    },
  } satisfies Prisma.InputJsonValue;
}

function toMaskedNotificationSettings(
  input: Partial<SiteNotificationSettings> | null | undefined,
  options: { passwordConfigured?: boolean } = {},
) {
  const settings = normalizeNotificationSettings(input, options);

  return {
    ...settings,
    smtp: {
      ...settings.smtp,
      password: '',
      passwordConfigured: Boolean(options.passwordConfigured),
    },
  } satisfies SiteNotificationSettings;
}

export async function readNotificationModuleSettings() {
  await ensureSeedSiteConfiguration();
  const record = await readSiteSettingsRecord();

  if (!record) {
    return cloneSiteSettings(DEFAULT_SITE_SETTINGS).notification;
  }

  return toMaskedNotificationSettings(resolvePersistedNotificationInput(record), {
    passwordConfigured: Boolean(record.notificationSecretsCiphertext),
  });
}

export async function readNotificationModuleRuntimeSettings() {
  await ensureSeedSiteConfiguration();
  const record = await readSiteSettingsRecord();

  if (!record) {
    return cloneSiteSettings(DEFAULT_SITE_SETTINGS).notification;
  }

  const settings = normalizeNotificationSettings(resolvePersistedNotificationInput(record), {
    passwordConfigured: Boolean(record.notificationSecretsCiphertext),
  });
  const smtpPassword = record.notificationSecretsCiphertext
    ? decryptNotificationSecrets(record.notificationSecretsCiphertext).smtpPassword.trim()
    : '';

  return {
    ...settings,
    smtp: {
      ...settings.smtp,
      password: smtpPassword,
      passwordConfigured: Boolean(record.notificationSecretsCiphertext),
    },
  } satisfies SiteNotificationSettings;
}

export async function saveNotificationModuleSettings(input: SiteNotificationSettings) {
  await ensureSeedSiteConfiguration();
  const normalizedInput = normalizeNotificationSettings(input, {
    passwordConfigured: input.smtp.passwordConfigured,
  });
  validateNotificationSettings(normalizedInput);

  const existingRecord = await readSiteSettingsRecord();
  const trimmedPassword = normalizedInput.smtp.password.trim();
  let notificationSecretsCiphertext: string | null = existingRecord?.notificationSecretsCiphertext ?? null;

  if (trimmedPassword) {
    notificationSecretsCiphertext = encryptNotificationSecrets({
      smtpPassword: trimmedPassword,
    });
  }
  else if (!normalizedInput.smtp.passwordConfigured) {
    notificationSecretsCiphertext = null;
  }

  const savedRecord = await updateNotificationModuleSettingsRecord({
    notificationSettingsJson: toNotificationModuleSettingsJson({
      ...normalizedInput,
      smtp: {
        ...normalizedInput.smtp,
        password: '',
        passwordConfigured: Boolean(notificationSecretsCiphertext),
      },
    }),
    notificationSecretsCiphertext,
  });

  return toMaskedNotificationSettings(resolvePersistedNotificationInput(savedRecord), {
    passwordConfigured: Boolean(savedRecord.notificationSecretsCiphertext),
  });
}

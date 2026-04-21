import { cloneSiteSettings, DEFAULT_SITE_SETTINGS } from '../../app/constants/site-settings';
import type { SiteNotificationSettings } from '../../app/types/admin-settings';

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

function ensureTextMaxLength(value: string, maxLength: number, message: string) {
  if (value.trim().length > maxLength) {
    throw createRequestError(400, message);
  }
}

export function normalizeNotificationSettings(
  input?: Partial<SiteNotificationSettings> | null,
  options: { passwordConfigured?: boolean } = {},
): SiteNotificationSettings {
  const base = cloneSiteSettings(DEFAULT_SITE_SETTINGS).notification;

  return {
    enabled: Boolean(input?.enabled),
    subjectPrefix: typeof input?.subjectPrefix === 'string' ? input.subjectPrefix.trim() : base.subjectPrefix,
    adminRecipients: Array.isArray(input?.adminRecipients)
      ? input.adminRecipients
        .map((item) => String(item || '').trim())
        .filter(Boolean)
      : [...base.adminRecipients],
    smtp: {
      host: typeof input?.smtp?.host === 'string' ? input.smtp.host.trim() : base.smtp.host,
      port: Number.isFinite(input?.smtp?.port)
        ? Number(input?.smtp?.port)
        : base.smtp.port,
      secure: typeof input?.smtp?.secure === 'boolean' ? input.smtp.secure : base.smtp.secure,
      username: typeof input?.smtp?.username === 'string' ? input.smtp.username.trim() : base.smtp.username,
      password: typeof input?.smtp?.password === 'string' ? input.smtp.password : '',
      passwordConfigured: typeof input?.smtp?.passwordConfigured === 'boolean'
        ? input.smtp.passwordConfigured
        : Boolean(options.passwordConfigured),
      fromName: typeof input?.smtp?.fromName === 'string' ? input.smtp.fromName.trim() : base.smtp.fromName,
      fromEmail: typeof input?.smtp?.fromEmail === 'string' ? input.smtp.fromEmail.trim() : base.smtp.fromEmail,
      replyToEmail: typeof input?.smtp?.replyToEmail === 'string' ? input.smtp.replyToEmail.trim() : base.smtp.replyToEmail,
    },
    events: {
      postCommentCreated: typeof input?.events?.postCommentCreated === 'boolean'
        ? input.events.postCommentCreated
        : base.events.postCommentCreated,
      postCommentReply: typeof input?.events?.postCommentReply === 'boolean'
        ? input.events.postCommentReply
        : base.events.postCommentReply,
      guestbookCreated: typeof input?.events?.guestbookCreated === 'boolean'
        ? input.events.guestbookCreated
        : base.events.guestbookCreated,
    },
  } satisfies SiteNotificationSettings;
}

export function validateNotificationSettings(input: SiteNotificationSettings) {
  ensureTextMaxLength(input.subjectPrefix, 80, '邮件主题前缀需控制在 80 个字符以内');

  if (!input.enabled) {
    return;
  }

  if (!input.adminRecipients.length) {
    throw createRequestError(400, '启用邮件通知时必须填写管理员收件邮箱');
  }

  for (const address of input.adminRecipients) {
    if (!EMAIL_PATTERN.test(address)) {
      throw createRequestError(400, '管理员收件邮箱格式无效');
    }
  }

  if (!input.smtp.host) {
    throw createRequestError(400, '启用邮件通知时必须填写 SMTP 主机');
  }

  if (!Number.isInteger(input.smtp.port) || input.smtp.port < 1 || input.smtp.port > 65535) {
    throw createRequestError(400, 'SMTP 端口需填写 1 到 65535 之间的整数');
  }

  if (!input.smtp.username) {
    throw createRequestError(400, '启用邮件通知时必须填写 SMTP 用户名');
  }

  if (!input.smtp.fromEmail || !EMAIL_PATTERN.test(input.smtp.fromEmail)) {
    throw createRequestError(400, '发件邮箱格式无效');
  }

  if (input.smtp.replyToEmail && !EMAIL_PATTERN.test(input.smtp.replyToEmail)) {
    throw createRequestError(400, '回复邮箱格式无效');
  }
}

import type { SiteNotificationSettings } from '~/types/admin-settings';

export type NotificationFormErrors = Record<string, string>;
export interface NotificationTestEmailFormInput {
  recipient: string;
  availableRecipients: string[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateNotificationSettingsForm(input: SiteNotificationSettings): NotificationFormErrors {
  const errors: NotificationFormErrors = {};
  const recipients = input.adminRecipients.map((item) => item.trim());
  const nonEmptyRecipients = recipients.filter(Boolean);

  if (input.subjectPrefix.trim().length > 80) {
    errors.subjectPrefix = '邮件主题前缀需控制在 80 个字符以内';
  }

  if (!input.enabled) {
    return errors;
  }

  if (!nonEmptyRecipients.length) {
    errors.adminRecipients = '启用邮件通知时必须填写管理员收件邮箱';
  }

  recipients.forEach((address, index) => {
    if (!address) {
      return;
    }

    if (!EMAIL_PATTERN.test(address)) {
      errors.adminRecipients ??= '管理员收件邮箱格式无效';
      errors[`adminRecipients.${index}`] = '管理员收件邮箱格式无效';
    }
  });

  if (!input.smtp.host.trim()) {
    errors['smtp.host'] = '启用邮件通知时必须填写 SMTP 主机';
  }

  if (!Number.isInteger(input.smtp.port) || input.smtp.port < 1 || input.smtp.port > 65535) {
    errors['smtp.port'] = 'SMTP 端口需填写 1 到 65535 之间的整数';
  }

  if (!input.smtp.username.trim()) {
    errors['smtp.username'] = '启用邮件通知时必须填写 SMTP 用户名';
  }

  if (!input.smtp.fromEmail.trim() || !EMAIL_PATTERN.test(input.smtp.fromEmail.trim())) {
    errors['smtp.fromEmail'] = '发件邮箱格式无效';
  }

  if (input.smtp.replyToEmail.trim() && !EMAIL_PATTERN.test(input.smtp.replyToEmail.trim())) {
    errors['smtp.replyToEmail'] = '回复邮箱格式无效';
  }

  return errors;
}

export function validateNotificationTestEmailForm(input: NotificationTestEmailFormInput): NotificationFormErrors {
  const errors: NotificationFormErrors = {};
  const recipient = input.recipient.trim();
  const availableRecipients = input.availableRecipients
    .map((item) => item.trim())
    .filter(Boolean);

  if (!availableRecipients.length) {
    errors.recipient = '当前没有可用于测试发信的已保存管理员邮箱';
    return errors;
  }

  if (!recipient) {
    errors.recipient = '请选择一个已保存的管理员邮箱';
    return errors;
  }

  if (!availableRecipients.includes(recipient)) {
    errors.recipient = '测试收件邮箱必须来自已保存的管理员邮箱';
  }

  return errors;
}

import { describe, expect, it } from 'vitest';
import type { SiteNotificationSettings } from '../../app/types/admin-settings';
import { cloneSiteSettings, DEFAULT_SITE_SETTINGS } from '../../app/constants/site-settings';
import {
  validateNotificationSettingsForm,
  validateNotificationTestEmailForm,
} from '../../app/utils/notification-form';

function createNotificationSettings(overrides: Partial<SiteNotificationSettings> = {}): SiteNotificationSettings {
  const base = cloneSiteSettings(DEFAULT_SITE_SETTINGS).notification;

  return {
    ...base,
    ...overrides,
    adminRecipients: overrides.adminRecipients ? [...overrides.adminRecipients] : [...base.adminRecipients],
    smtp: {
      ...base.smtp,
      ...overrides.smtp,
    },
    events: {
      ...base.events,
      ...overrides.events,
    },
  };
}

describe('notification form helpers', () => {
  it('requires an admin recipient when email notification is enabled', () => {
    const errors = validateNotificationSettingsForm(createNotificationSettings({
      enabled: true,
      adminRecipients: [],
      smtp: {
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        username: 'notify@example.com',
        password: '',
        passwordConfigured: false,
        fromName: 'Blog Notify',
        fromEmail: 'notify@example.com',
        replyToEmail: '',
      },
    }));

    expect(errors.adminRecipients).toBe('启用邮件通知时必须填写管理员收件邮箱');
  });

  it('validates recipient, smtp, and sender fields when email notification is enabled', () => {
    const errors = validateNotificationSettingsForm(createNotificationSettings({
      enabled: true,
      adminRecipients: ['admin@example.com', 'invalid-email'],
      smtp: {
        host: '   ',
        port: 70000,
        secure: false,
        username: '   ',
        password: '',
        passwordConfigured: false,
        fromName: '',
        fromEmail: 'invalid-email',
        replyToEmail: 'reply-without-domain',
      },
    }));

    expect(errors.adminRecipients).toBe('管理员收件邮箱格式无效');
    expect(errors['adminRecipients.1']).toBe('管理员收件邮箱格式无效');
    expect(errors['smtp.host']).toBe('启用邮件通知时必须填写 SMTP 主机');
    expect(errors['smtp.port']).toBe('SMTP 端口需填写 1 到 65535 之间的整数');
    expect(errors['smtp.username']).toBe('启用邮件通知时必须填写 SMTP 用户名');
    expect(errors['smtp.fromEmail']).toBe('发件邮箱格式无效');
    expect(errors['smtp.replyToEmail']).toBe('回复邮箱格式无效');
  });

  it('rejects an overlong subject prefix even when the feature stays disabled', () => {
    const errors = validateNotificationSettingsForm(createNotificationSettings({
      enabled: false,
      subjectPrefix: 'x'.repeat(81),
    }));

    expect(errors.subjectPrefix).toBe('邮件主题前缀需控制在 80 个字符以内');
  });

  it('allows an empty smtp password when keeping or clearing the saved secret', () => {
    const keepSavedPasswordErrors = validateNotificationSettingsForm(createNotificationSettings({
      enabled: true,
      adminRecipients: ['admin@example.com'],
      smtp: {
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        username: 'notify@example.com',
        password: '',
        passwordConfigured: true,
        fromName: 'Blog Notify',
        fromEmail: 'notify@example.com',
        replyToEmail: '',
      },
    }));

    const clearSavedPasswordErrors = validateNotificationSettingsForm(createNotificationSettings({
      enabled: true,
      adminRecipients: ['admin@example.com'],
      smtp: {
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        username: 'notify@example.com',
        password: '',
        passwordConfigured: false,
        fromName: 'Blog Notify',
        fromEmail: 'notify@example.com',
        replyToEmail: '',
      },
    }));

    expect(keepSavedPasswordErrors).toEqual({});
    expect(clearSavedPasswordErrors).toEqual({});
  });

  it('requires a saved admin recipient to send a test email', () => {
    const errors = validateNotificationTestEmailForm({
      recipient: '',
      availableRecipients: ['admin@example.com'],
    });

    expect(errors.recipient).toBe('请选择一个已保存的管理员邮箱');
  });

  it('rejects a recipient outside the saved admin recipients', () => {
    const errors = validateNotificationTestEmailForm({
      recipient: 'other@example.com',
      availableRecipients: ['admin@example.com'],
    });

    expect(errors.recipient).toBe('测试收件邮箱必须来自已保存的管理员邮箱');
  });
});

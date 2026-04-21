import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readSiteSettingsRecord: vi.fn(),
  updateNotificationModuleSettingsRecord: vi.fn(),
  ensureSeedSiteConfiguration: vi.fn(),
}));

vi.mock('../../server/repositories/site-settings.repository', () => ({
  readSiteSettingsRecord: mocks.readSiteSettingsRecord,
  updateNotificationModuleSettingsRecord: mocks.updateNotificationModuleSettingsRecord,
}));

vi.mock('../../server/services/site-settings.service', () => ({
  ensureSeedSiteConfiguration: mocks.ensureSeedSiteConfiguration,
}));

function createSiteSettingsRecord() {
  return {
    id: 1,
    siteCode: 'default',
    siteName: '个人博客',
    siteUrl: 'https://example.com',
    siteDescription: '站点简介',
    siteLogoUrl: null,
    siteLogoAlt: '个人博客 标志',
    ownerName: '个人博客',
    ownerAvatarUrl: null,
    ownerBio: '个人简介',
    ownerLocation: 'Shanghai, China',
    ownerTagline: 'Based in Earth',
    friendCardName: '友链卡片',
    friendCardDescription: '友链说明',
    friendCardUrl: 'https://example.com',
    friendCardAvatarUrl: null,
    contactEmail: 'hello@example.com',
    footerCopyright: '© 2026 Example',
    footerIcpText: '备案号',
    footerIcpLink: 'https://beian.miit.gov.cn/',
    footerNote: '',
    turnstileSiteKey: 'turnstile-site-key',
    securitySettingsJson: {},
    notificationSettingsJson: {
      enabled: true,
      subjectPrefix: '[Blog 审核通知]',
      adminRecipients: ['admin@example.com', 'ops@example.com'],
      smtp: {
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        username: 'notify@example.com',
        fromName: 'Blog Notice',
        fromEmail: 'notify@example.com',
        replyToEmail: 'reply@example.com',
      },
      events: {
        postCommentCreated: true,
        postCommentReply: false,
        guestbookCreated: false,
      },
    },
    notificationSecretsCiphertext: 'ciphertext',
    socialLinks: [],
    navItems: [],
  };
}

describe('notification module settings persistence', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('createError', (input: Record<string, unknown>) => Object.assign(new Error(String(input.statusMessage || 'request error')), input));
    vi.stubGlobal('useRuntimeConfig', () => ({
      encryptionSecretKey: '12345678901234567890123456789012',
    }));
    mocks.ensureSeedSiteConfiguration.mockResolvedValue(undefined);
    mocks.readSiteSettingsRecord.mockResolvedValue(createSiteSettingsRecord());
    mocks.updateNotificationModuleSettingsRecord.mockImplementation(async ({ notificationSettingsJson, notificationSecretsCiphertext }) => ({
      ...createSiteSettingsRecord(),
      notificationSettingsJson,
      notificationSecretsCiphertext,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads persisted notification settings through the module service and masks the smtp password', async () => {
    const service = await import('../../server/services/notification-module.service');

    const settings = await service.readNotificationModuleSettings();

    expect(settings.enabled).toBe(true);
    expect(settings.subjectPrefix).toBe('[Blog 审核通知]');
    expect(settings.adminRecipients).toEqual(['admin@example.com', 'ops@example.com']);
    expect(settings.smtp).toEqual({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      username: 'notify@example.com',
      password: '',
      passwordConfigured: true,
      fromName: 'Blog Notice',
      fromEmail: 'notify@example.com',
      replyToEmail: 'reply@example.com',
    });
    expect(settings.events).toEqual({
      postCommentCreated: true,
      postCommentReply: false,
      guestbookCreated: false,
    });
  });

  it('saves notification settings and encrypts the smtp password into ciphertext', async () => {
    const service = await import('../../server/services/notification-module.service');

    const savedSettings = await service.saveNotificationModuleSettings({
      enabled: true,
      subjectPrefix: '[待审核通知]',
      adminRecipients: ['admin@example.com', 'ops@example.com'],
      smtp: {
        host: 'smtp.mail.example.com',
        port: 587,
        secure: false,
        username: 'mailer@example.com',
        password: 'smtp-password-123',
        passwordConfigured: true,
        fromName: 'Blog Notify',
        fromEmail: 'mailer@example.com',
        replyToEmail: 'reply@example.com',
      },
      events: {
        postCommentCreated: true,
        postCommentReply: true,
        guestbookCreated: true,
      },
    });

    expect(mocks.updateNotificationModuleSettingsRecord).toHaveBeenCalledWith({
      notificationSettingsJson: expect.objectContaining({
        subjectPrefix: '[待审核通知]',
        smtp: expect.objectContaining({
          username: 'mailer@example.com',
        }),
      }),
      notificationSecretsCiphertext: expect.any(String),
    });

    const persistedPayload = mocks.updateNotificationModuleSettingsRecord.mock.calls[0]?.[0];
    expect(persistedPayload.notificationSecretsCiphertext).not.toContain('smtp-password-123');
    expect(savedSettings.smtp.password).toBe('');
    expect(savedSettings.smtp.passwordConfigured).toBe(true);
  });

  it('keeps existing ciphertext when the smtp password input stays empty and passwordConfigured is true', async () => {
    const service = await import('../../server/services/notification-module.service');

    await service.saveNotificationModuleSettings({
      enabled: true,
      subjectPrefix: '[待审核通知]',
      adminRecipients: ['admin@example.com'],
      smtp: {
        host: 'smtp.mail.example.com',
        port: 587,
        secure: false,
        username: 'mailer@example.com',
        password: '',
        passwordConfigured: true,
        fromName: 'Blog Notify',
        fromEmail: 'mailer@example.com',
        replyToEmail: '',
      },
      events: {
        postCommentCreated: true,
        postCommentReply: true,
        guestbookCreated: true,
      },
    });

    expect(mocks.updateNotificationModuleSettingsRecord).toHaveBeenCalledWith(expect.objectContaining({
      notificationSecretsCiphertext: 'ciphertext',
    }));
  });

  it('clears the ciphertext when passwordConfigured is false and the password input is empty', async () => {
    const service = await import('../../server/services/notification-module.service');

    await service.saveNotificationModuleSettings({
      enabled: true,
      subjectPrefix: '[待审核通知]',
      adminRecipients: ['admin@example.com'],
      smtp: {
        host: 'smtp.mail.example.com',
        port: 587,
        secure: false,
        username: 'mailer@example.com',
        password: '',
        passwordConfigured: false,
        fromName: 'Blog Notify',
        fromEmail: 'mailer@example.com',
        replyToEmail: '',
      },
      events: {
        postCommentCreated: true,
        postCommentReply: true,
        guestbookCreated: true,
      },
    });

    expect(mocks.updateNotificationModuleSettingsRecord).toHaveBeenCalledWith(expect.objectContaining({
      notificationSecretsCiphertext: null,
    }));
  });
});

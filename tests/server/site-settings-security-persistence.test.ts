import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneSiteSettings, DEFAULT_SITE_SETTINGS } from '../../app/constants/site-settings';

const mocks = vi.hoisted(() => ({
  readSiteSettingsRecord: vi.fn(),
  upsertSiteSettingsRecord: vi.fn(),
  ensureSeedPageSettings: vi.fn(),
}));

vi.mock('../../server/repositories/site-settings.repository', () => ({
  readSiteSettingsRecord: mocks.readSiteSettingsRecord,
  upsertSiteSettingsRecord: mocks.upsertSiteSettingsRecord,
}));

vi.mock('../../server/services/page-settings.service', () => ({
  ensureSeedPageSettings: mocks.ensureSeedPageSettings,
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
    securitySettingsJson: {
      login: {
        captchaEnabled: true,
        rateLimit: {
          windowSeconds: 120,
          maxPerIp: 8,
          maxPerSession: 4,
        },
        maxFailures: 5,
        cooldownSeconds: 900,
      },
      comments: {
        captchaEnabled: true,
        rateLimit: {
          windowSeconds: 300,
          maxPerIp: 6,
          maxPerSession: 3,
        },
      },
      guestbook: {
        captchaEnabled: false,
        rateLimit: {
          windowSeconds: 300,
          maxPerIp: 4,
          maxPerSession: 2,
        },
      },
      linkApplications: {
        captchaEnabled: true,
        rateLimit: {
          windowSeconds: 1800,
          maxPerIp: 3,
          maxPerSession: 1,
        },
      },
      likes: {
        rateLimit: {
          windowSeconds: 300,
          maxPerIp: 30,
          maxPerSession: 10,
        },
      },
    },
    socialLinks: [],
    navItems: [],
  };
}

describe('site settings security persistence', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('createError', (input: Record<string, unknown>) => Object.assign(new Error(String(input.statusMessage || 'request error')), input));
    mocks.ensureSeedPageSettings.mockResolvedValue(undefined);
    mocks.readSiteSettingsRecord.mockResolvedValue(createSiteSettingsRecord());
    mocks.upsertSiteSettingsRecord.mockImplementation(async (input) => ({
      ...createSiteSettingsRecord(),
      siteName: input.site.name,
      siteUrl: input.site.url,
      siteDescription: input.site.description,
      siteLogoUrl: input.site.logoUrl || null,
      siteLogoAlt: input.site.logoAlt,
      ownerName: input.owner.name,
      ownerAvatarUrl: input.owner.avatarUrl || null,
      ownerBio: input.owner.bio,
      ownerLocation: input.owner.location || null,
      ownerTagline: input.owner.tagline || null,
      contactEmail: input.footer.contactEmail,
      footerCopyright: input.footer.copyright,
      footerIcpText: input.footer.icpText || null,
      footerIcpLink: input.footer.icpLink || null,
      footerNote: input.footer.note || null,
      turnstileSiteKey: input.security.turnstileSiteKey,
      securitySettingsJson: {
        login: input.security.login,
        comments: input.security.comments,
        guestbook: input.security.guestbook,
        linkApplications: input.security.linkApplications,
        likes: input.security.likes,
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads persisted security settings into the admin settings form and public security config', async () => {
    const service = await import('../../server/services/site-settings.service');

    const settings = await service.readSiteSettings();
    const publicConfig = await service.readPublicSecurityConfig();

    expect(settings.security.turnstileSiteKey).toBe('turnstile-site-key');
    expect(settings.security.login.captchaEnabled).toBe(true);
    expect(settings.security.comments.rateLimit.maxPerSession).toBe(3);
    expect(publicConfig).toEqual({
      turnstileSiteKey: 'turnstile-site-key',
      loginCaptchaEnabled: true,
      commentCaptchaEnabled: true,
      guestbookCaptchaEnabled: false,
      linkApplicationCaptchaEnabled: true,
    });
  });

  it('saves security settings together with the site settings form', async () => {
    const service = await import('../../server/services/site-settings.service');
    const form = cloneSiteSettings(DEFAULT_SITE_SETTINGS) as typeof DEFAULT_SITE_SETTINGS & {
      security: ReturnType<typeof createSiteSettingsRecord>['securitySettingsJson'] & { turnstileSiteKey: string };
    };

    form.security = {
      turnstileSiteKey: 'updated-turnstile-site-key',
      login: {
        captchaEnabled: true,
        rateLimit: {
          windowSeconds: 180,
          maxPerIp: 9,
          maxPerSession: 4,
        },
        maxFailures: 6,
        cooldownSeconds: 600,
      },
      comments: {
        captchaEnabled: true,
        rateLimit: {
          windowSeconds: 120,
          maxPerIp: 5,
          maxPerSession: 3,
        },
      },
      guestbook: {
        captchaEnabled: false,
        rateLimit: {
          windowSeconds: 240,
          maxPerIp: 4,
          maxPerSession: 2,
        },
      },
      linkApplications: {
        captchaEnabled: true,
        rateLimit: {
          windowSeconds: 1800,
          maxPerIp: 2,
          maxPerSession: 1,
        },
      },
      likes: {
        rateLimit: {
          windowSeconds: 300,
          maxPerIp: 20,
          maxPerSession: 10,
        },
      },
    };

    await service.saveSiteSettings(form as never);

    expect(mocks.upsertSiteSettingsRecord).toHaveBeenCalledWith(expect.objectContaining({
      security: expect.objectContaining({
        turnstileSiteKey: 'updated-turnstile-site-key',
        login: expect.objectContaining({
          maxFailures: 6,
        }),
      }),
    }));
  });
});

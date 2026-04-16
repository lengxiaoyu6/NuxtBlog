import { describe, expect, it } from 'vitest';
import type { SiteSecuritySettings } from '../../shared/types/security';
import { cloneSiteSecuritySettings, DEFAULT_SITE_SECURITY_SETTINGS } from '../../shared/constants/security';
import { isCaptchaRequired, validateSecuritySettingsForm } from '../../app/utils/security-form';

function createSecuritySettings(overrides: Partial<SiteSecuritySettings> = {}): SiteSecuritySettings {
  return {
    ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS),
    ...overrides,
    login: {
      ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS).login,
      ...overrides.login,
      rateLimit: {
        ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS).login.rateLimit,
        ...overrides.login?.rateLimit,
      },
    },
    comments: {
      ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS).comments,
      ...overrides.comments,
      rateLimit: {
        ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS).comments.rateLimit,
        ...overrides.comments?.rateLimit,
      },
    },
    guestbook: {
      ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS).guestbook,
      ...overrides.guestbook,
      rateLimit: {
        ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS).guestbook.rateLimit,
        ...overrides.guestbook?.rateLimit,
      },
    },
    linkApplications: {
      ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS).linkApplications,
      ...overrides.linkApplications,
      rateLimit: {
        ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS).linkApplications.rateLimit,
        ...overrides.linkApplications?.rateLimit,
      },
    },
    likes: {
      ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS).likes,
      ...overrides.likes,
      rateLimit: {
        ...cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS).likes.rateLimit,
        ...overrides.likes?.rateLimit,
      },
    },
  };
}

describe('security ui helpers', () => {
  it('maps captcha requirement by scene', () => {
    const securityConfig = {
      turnstileSiteKey: 'site-key',
      loginCaptchaEnabled: true,
      commentCaptchaEnabled: false,
      guestbookCaptchaEnabled: true,
      linkApplicationCaptchaEnabled: true,
    };

    expect(isCaptchaRequired('login', securityConfig)).toBe(true);
    expect(isCaptchaRequired('comment', securityConfig)).toBe(false);
    expect(isCaptchaRequired('guestbook', securityConfig)).toBe(true);
    expect(isCaptchaRequired('linkApplication', securityConfig)).toBe(true);
  });

  it('requires turnstile site key when any captcha is enabled', () => {
    const errors = validateSecuritySettingsForm(createSecuritySettings({
      turnstileSiteKey: '   ',
      comments: {
        captchaEnabled: true,
        rateLimit: {
          windowSeconds: 300,
          maxPerIp: 6,
          maxPerSession: 3,
        },
      },
    }));

    expect(errors.turnstileSiteKey).toBe('启用人机校验时必须填写 Turnstile Site Key');
  });

  it('rejects rate limit values where session limit exceeds ip limit', () => {
    const errors = validateSecuritySettingsForm(createSecuritySettings({
      comments: {
        captchaEnabled: false,
        rateLimit: {
          windowSeconds: 300,
          maxPerIp: 2,
          maxPerSession: 3,
        },
      },
    }));

    expect(errors['comments.rateLimit.maxPerSession']).toBe('评论限流的会话次数上限不能大于 IP 次数上限');
  });

  it('rejects non-positive login failure settings', () => {
    const errors = validateSecuritySettingsForm(createSecuritySettings({
      login: {
        captchaEnabled: false,
        rateLimit: {
          windowSeconds: 300,
          maxPerIp: 12,
          maxPerSession: 6,
        },
        maxFailures: 0,
        cooldownSeconds: 0,
      },
    }));

    expect(errors['login.maxFailures']).toBe('登录失败次数上限必须为正整数');
    expect(errors['login.cooldownSeconds']).toBe('登录冷却时间必须为正整数');
  });
});

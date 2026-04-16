import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadSecuritySettingsModule() {
  try {
    return await import('../../server/services/security-settings.service');
  }
  catch {
    return null;
  }
}

describe('security settings service', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('createError', (input: Record<string, unknown>) => Object.assign(new Error(String(input.statusMessage || 'request error')), input));
  });

  it('merges partial input with default security settings', async () => {
    const mod = await loadSecuritySettingsModule();
    expect(mod).not.toBeNull();

    const normalized = mod!.normalizeSecuritySettings({
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
          windowSeconds: 180,
          maxPerIp: 3,
          maxPerSession: 2,
        },
      },
    });

    expect(normalized.login).toEqual({
      captchaEnabled: true,
      rateLimit: {
        windowSeconds: 120,
        maxPerIp: 8,
        maxPerSession: 4,
      },
      maxFailures: 5,
      cooldownSeconds: 900,
    });
    expect(normalized.comments.captchaEnabled).toBe(true);
    expect(normalized.guestbook).toEqual(mod!.DEFAULT_SECURITY_SETTINGS.guestbook);
    expect(normalized.likes).toEqual(mod!.DEFAULT_SECURITY_SETTINGS.likes);
  });

  it('maps stored settings to the public captcha configuration', async () => {
    const mod = await loadSecuritySettingsModule();
    expect(mod).not.toBeNull();

    const publicConfig = mod!.buildPublicSecurityConfig({
      turnstileSiteKey: ' public-site-key ',
      security: mod!.normalizeSecuritySettings({
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
            windowSeconds: 180,
            maxPerIp: 3,
            maxPerSession: 2,
          },
        },
        guestbook: {
          captchaEnabled: true,
          rateLimit: {
            windowSeconds: 180,
            maxPerIp: 3,
            maxPerSession: 2,
          },
        },
        linkApplications: {
          captchaEnabled: false,
          rateLimit: {
            windowSeconds: 600,
            maxPerIp: 2,
            maxPerSession: 1,
          },
        },
      }),
    });

    expect(publicConfig).toEqual({
      turnstileSiteKey: 'public-site-key',
      loginCaptchaEnabled: true,
      commentCaptchaEnabled: true,
      guestbookCaptchaEnabled: true,
      linkApplicationCaptchaEnabled: false,
    });
  });

  it('requires a turnstile site key when any public captcha is enabled', async () => {
    const mod = await loadSecuritySettingsModule();
    expect(mod).not.toBeNull();

    expect(() => mod!.validateSecuritySettings(mod!.normalizeSiteSecuritySettings({
      turnstileSiteKey: ' ',
      comments: {
        captchaEnabled: true,
      },
    }))).toThrowError(expect.objectContaining({
      statusCode: 400,
      statusMessage: '启用人机校验时必须填写 Turnstile Site Key',
    }));
  });
});

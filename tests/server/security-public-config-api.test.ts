import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readPublicSecurityConfig: vi.fn(),
}));

vi.mock('../../server/services/site-settings.service', () => ({
  readPublicSecurityConfig: mocks.readPublicSecurityConfig,
}));

describe('security public config api', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
    mocks.readPublicSecurityConfig.mockResolvedValue({
      turnstileSiteKey: 'site-key',
      loginCaptchaEnabled: true,
      commentCaptchaEnabled: true,
      guestbookCaptchaEnabled: false,
      linkApplicationCaptchaEnabled: true,
    });
  });

  it('returns the public security configuration for captcha-enabled forms', async () => {
    const handlerModule = await import('../../server/api/security/public-config.get');
    const result = await handlerModule.default({} as never);

    expect(mocks.readPublicSecurityConfig).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      turnstileSiteKey: 'site-key',
      loginCaptchaEnabled: true,
      commentCaptchaEnabled: true,
      guestbookCaptchaEnabled: false,
      linkApplicationCaptchaEnabled: true,
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyAdminCredentials: vi.fn(),
  changeAdminPassword: vi.fn(),
  readSiteSecuritySettings: vi.fn(),
  securityRequestService: {
    consumeRateLimit: vi.fn(),
    verifyTurnstile: vi.fn(),
    assertLoginAllowed: vi.fn(),
    registerLoginFailure: vi.fn(),
    clearLoginFailures: vi.fn(),
  },
}));

vi.mock('../../server/services/auth.service', () => ({
  verifyAdminCredentials: mocks.verifyAdminCredentials,
  changeAdminPassword: mocks.changeAdminPassword,
}));

vi.mock('../../server/services/site-settings.service', () => ({
  readSiteSecuritySettings: mocks.readSiteSecuritySettings,
}));

vi.mock('../../server/services/security-request.service', () => ({
  useSecurityRequestService: () => mocks.securityRequestService,
}));

function createRuntimeError(input: Record<string, unknown>) {
  return Object.assign(new Error(String(input.statusMessage || input.message || 'request error')), input);
}

function createSiteSecuritySettings() {
  return {
    turnstileSiteKey: 'site-key',
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
      captchaEnabled: false,
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
      captchaEnabled: false,
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
  };
}

describe('auth controller security integration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('readBody', vi.fn());
    vi.stubGlobal('createError', createRuntimeError);
    vi.stubGlobal('setUserSession', vi.fn().mockResolvedValue(undefined));
    vi.stubGlobal('clearUserSession', vi.fn().mockResolvedValue(undefined));
    vi.stubGlobal('getUserSession', vi.fn().mockResolvedValue({}));

    mocks.readSiteSecuritySettings.mockResolvedValue(createSiteSecuritySettings());
    mocks.securityRequestService.consumeRateLimit.mockResolvedValue({});
    mocks.securityRequestService.verifyTurnstile.mockResolvedValue({ ok: true });
    mocks.securityRequestService.assertLoginAllowed.mockResolvedValue({ allowed: true });
    mocks.securityRequestService.registerLoginFailure.mockResolvedValue({
      cooldownTriggered: false,
      remainingAttempts: 4,
    });
    mocks.securityRequestService.clearLoginFailures.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('checks rate limit, cooldown and captcha before credential verification, then records login failures', async () => {
    const readBody = vi.mocked(globalThis.readBody);
    readBody.mockResolvedValue({
      username: ' admin ',
      password: 'wrong-password',
      turnstileToken: 'turnstile-token',
    });
    mocks.verifyAdminCredentials.mockResolvedValue(null);

    const { authController } = await import('../../server/controllers/auth.controller');

    await expect(authController.login({} as never)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: '用户名或密码错误',
    });

    expect(mocks.securityRequestService.consumeRateLimit).toHaveBeenCalledWith({}, {
      action: 'auth_login',
      policy: {
        windowMs: 120_000,
        limits: {
          ip: 8,
          session: 4,
        },
      },
      blockedMessage: '登录请求过于频繁，请稍后再试',
    });
    expect(mocks.securityRequestService.assertLoginAllowed).toHaveBeenCalledWith({}, {
      windowMs: 120_000,
      cooldownMs: 900_000,
      maxFailures: 5,
    });
    expect(mocks.securityRequestService.verifyTurnstile).toHaveBeenCalledWith({}, {
      enabled: true,
      token: 'turnstile-token',
    });
    expect(mocks.verifyAdminCredentials).toHaveBeenCalledWith('admin', 'wrong-password');
    expect(mocks.securityRequestService.registerLoginFailure).toHaveBeenCalledWith({}, {
      windowMs: 120_000,
      cooldownMs: 900_000,
      maxFailures: 5,
    });
    expect(mocks.securityRequestService.clearLoginFailures).not.toHaveBeenCalled();

    expect(mocks.securityRequestService.verifyTurnstile.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.verifyAdminCredentials.mock.invocationCallOrder[0],
    );
  });

  it('clears recorded login failures after successful authentication', async () => {
    const readBody = vi.mocked(globalThis.readBody);
    readBody.mockResolvedValue({
      username: 'admin',
      password: 'correct-password',
      turnstileToken: 'turnstile-token',
    });
    mocks.verifyAdminCredentials.mockResolvedValue({
      id: 'admin-id',
      username: 'admin',
      displayName: '管理员',
      mustChangePassword: false,
    });

    const { authController } = await import('../../server/controllers/auth.controller');
    const result = await authController.login({} as never);

    expect(mocks.securityRequestService.registerLoginFailure).not.toHaveBeenCalled();
    expect(mocks.securityRequestService.clearLoginFailures).toHaveBeenCalledWith({});
    expect(globalThis.setUserSession).toHaveBeenCalledWith({}, expect.objectContaining({
      user: expect.objectContaining({ username: 'admin' }),
    }));
    expect(result).toMatchObject({
      ok: true,
      user: expect.objectContaining({ username: 'admin' }),
    });
  });
});

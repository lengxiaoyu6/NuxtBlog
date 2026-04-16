import { describe, expect, it, vi } from 'vitest';

async function loadTurnstileModule() {
  try {
    return await import('../../server/services/security-turnstile.service');
  }
  catch {
    return null;
  }
}

describe('createTurnstileVerificationService', () => {
  it('rejects missing tokens when captcha is enabled', async () => {
    const mod = await loadTurnstileModule();
    expect(mod).not.toBeNull();

    const service = mod!.createTurnstileVerificationService({
      fetchImpl: vi.fn(),
    });

    await expect(service.verifyToken({
      enabled: true,
      secretKey: 'secret',
      token: '',
      remoteIp: '127.0.0.1',
    })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects invalid tokens reported by turnstile', async () => {
    const mod = await loadTurnstileModule();
    expect(mod).not.toBeNull();

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        'error-codes': ['invalid-input-response'],
      }),
    });

    const service = mod!.createTurnstileVerificationService({ fetchImpl });

    await expect(service.verifyToken({
      enabled: true,
      secretKey: 'secret',
      token: 'bad-token',
      remoteIp: '127.0.0.1',
    })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('accepts valid tokens', async () => {
    const mod = await loadTurnstileModule();
    expect(mod).not.toBeNull();

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    const service = mod!.createTurnstileVerificationService({ fetchImpl });

    await expect(service.verifyToken({
      enabled: true,
      secretKey: 'secret',
      token: 'good-token',
      remoteIp: '127.0.0.1',
    })).resolves.toMatchObject({ ok: true });
  });

  it('skips verification when captcha is disabled', async () => {
    const mod = await loadTurnstileModule();
    expect(mod).not.toBeNull();

    const fetchImpl = vi.fn();
    const service = mod!.createTurnstileVerificationService({ fetchImpl });

    await expect(service.verifyToken({
      enabled: false,
      secretKey: '',
      token: '',
      remoteIp: '127.0.0.1',
    })).resolves.toMatchObject({ ok: true, skipped: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports service configuration errors when captcha is enabled without a secret key', async () => {
    const mod = await loadTurnstileModule();
    expect(mod).not.toBeNull();

    const service = mod!.createTurnstileVerificationService({
      fetchImpl: vi.fn(),
    });

    await expect(service.verifyToken({
      enabled: true,
      secretKey: '',
      token: 'token',
      remoteIp: '127.0.0.1',
    })).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});

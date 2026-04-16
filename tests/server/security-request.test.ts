import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

async function loadSecurityRequestModule() {
  try {
    return await import('../../server/services/security-request.service');
  }
  catch {
    return null;
  }
}

function createMockEvent(input: { forwardedFor?: string; cookie?: string; remoteAddress?: string } = {}) {
  const headers: Record<string, string> = {};

  if (input.forwardedFor) {
    headers['x-forwarded-for'] = input.forwardedFor;
  }

  if (input.cookie) {
    headers.cookie = input.cookie;
  }

  const responseHeaders = new Map<string, string | string[]>();

  return {
    node: {
      req: {
        headers,
        socket: {
          remoteAddress: input.remoteAddress || '127.0.0.1',
        },
      },
      res: {
        getHeader(name: string) {
          return responseHeaders.get(name.toLowerCase());
        },
        setHeader(name: string, value: string | string[]) {
          responseHeaders.set(name.toLowerCase(), value);
        },
      },
    },
  } as const;
}

describe('security request service', () => {
  it('extracts client ip and creates a persistent anonymous session cookie', async () => {
    const mod = await loadSecurityRequestModule();
    expect(mod).not.toBeNull();

    const service = mod!.createSecurityRequestService({
      hashSalt: 'salt-value',
      turnstileSecretKey: 'secret-key',
      generateSessionId: () => 'session-new',
      rateLimitService: {
        consumeLimit: vi.fn(),
      },
      authSecurityService: {
        assertAllowed: vi.fn(),
        registerFailure: vi.fn(),
        clearFailures: vi.fn(),
      },
      turnstileService: {
        verifyToken: vi.fn(),
      },
    });
    const event = createMockEvent({
      forwardedFor: '203.0.113.9, 10.0.0.1',
    });

    const context = await service.resolveRequestContext(event);

    expect(context.ip).toBe('203.0.113.9');
    expect(context.sessionId).toBe('session-new');
    expect(context.ipLabel).toBe('203.0.113.*');
    expect(context.sessionLabel).toBe('session:session-');
    expect(context.identity).toEqual({
      ipHash: createHash('sha256').update('salt-value:203.0.113.9').digest('hex'),
      sessionHash: createHash('sha256').update('salt-value:session-new').digest('hex'),
    });
    expect(event.node.res.getHeader('set-cookie')).toEqual(expect.stringContaining('security_sid=session-new'));
  });

  it('blocks over-limit requests by ip and session identity', async () => {
    const mod = await loadSecurityRequestModule();
    expect(mod).not.toBeNull();

    const consumeLimit = vi.fn().mockResolvedValue({
      allowed: false,
      dimension: 'session',
      retryAfterSeconds: 45,
    });
    const service = mod!.createSecurityRequestService({
      hashSalt: 'salt-value',
      turnstileSecretKey: 'secret-key',
      generateSessionId: () => 'session-existing',
      rateLimitService: {
        consumeLimit,
      },
      authSecurityService: {
        assertAllowed: vi.fn(),
        registerFailure: vi.fn(),
        clearFailures: vi.fn(),
      },
      turnstileService: {
        verifyToken: vi.fn(),
      },
    });
    const event = createMockEvent({
      cookie: 'security_sid=session-existing',
      remoteAddress: '198.51.100.25',
    });

    await expect(service.consumeRateLimit(event, {
      action: 'post_like',
      policy: {
        windowMs: 60_000,
        limits: {
          ip: 10,
          session: 1,
        },
      },
      blockedMessage: '请求过于频繁，请稍后再试',
    })).rejects.toMatchObject({
      statusCode: 429,
      statusMessage: '请求过于频繁，请稍后再试',
    });

    expect(consumeLimit).toHaveBeenCalledWith({
      action: 'post_like',
      identity: {
        ipHash: createHash('sha256').update('salt-value:198.51.100.25').digest('hex'),
        sessionHash: createHash('sha256').update('salt-value:session-existing').digest('hex'),
      },
      policy: {
        windowMs: 60_000,
        limits: {
          ip: 10,
          session: 1,
        },
      },
    });
    expect(event.node.res.getHeader('retry-after')).toBe('45');
  });

  it('forwards turnstile verification with the resolved client ip', async () => {
    const mod = await loadSecurityRequestModule();
    expect(mod).not.toBeNull();

    const verifyToken = vi.fn().mockResolvedValue({ ok: true });
    const service = mod!.createSecurityRequestService({
      hashSalt: 'salt-value',
      turnstileSecretKey: 'secret-key',
      generateSessionId: () => 'session-existing',
      rateLimitService: {
        consumeLimit: vi.fn(),
      },
      authSecurityService: {
        assertAllowed: vi.fn(),
        registerFailure: vi.fn(),
        clearFailures: vi.fn(),
      },
      turnstileService: {
        verifyToken,
      },
    });
    const event = createMockEvent({
      forwardedFor: '198.51.100.60',
      cookie: 'security_sid=session-existing',
    });

    await service.verifyTurnstile(event, {
      enabled: true,
      token: 'turnstile-token',
    });

    expect(verifyToken).toHaveBeenCalledWith({
      enabled: true,
      secretKey: 'secret-key',
      token: 'turnstile-token',
      remoteIp: '198.51.100.60',
    });
  });

  it('enters login cooldown after repeated failures', async () => {
    const mod = await loadSecurityRequestModule();
    expect(mod).not.toBeNull();

    const registerFailure = vi.fn().mockResolvedValue({
      cooldownTriggered: true,
      retryAfterSeconds: 120,
      remainingAttempts: 0,
    });
    const service = mod!.createSecurityRequestService({
      hashSalt: 'salt-value',
      turnstileSecretKey: 'secret-key',
      generateSessionId: () => 'session-existing',
      rateLimitService: {
        consumeLimit: vi.fn(),
      },
      authSecurityService: {
        assertAllowed: vi.fn(),
        registerFailure,
        clearFailures: vi.fn(),
      },
      turnstileService: {
        verifyToken: vi.fn(),
      },
    });
    const event = createMockEvent({
      cookie: 'security_sid=session-existing',
      remoteAddress: '127.0.0.1',
    });

    await expect(service.registerLoginFailure(event, {
      windowMs: 600_000,
      cooldownMs: 120_000,
      maxFailures: 5,
    })).rejects.toMatchObject({
      statusCode: 429,
    });

    expect(registerFailure).toHaveBeenCalled();
    expect(event.node.res.getHeader('retry-after')).toBe('120');
  });
});

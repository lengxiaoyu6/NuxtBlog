import { createHash, randomUUID } from 'node:crypto';
import { createError } from 'h3';
import {
  createSecurityAlert,
  deleteSecurityThrottleStatesByAction,
  findSecurityThrottleState,
  saveSecurityThrottleState,
} from '../repositories/security.repository';
import { createAuthSecurityService } from './auth-security.service';
import { createSecurityRateLimitService } from './security-rate-limit.service';
import { createTurnstileVerificationService } from './security-turnstile.service';

const SECURITY_SESSION_COOKIE = 'security_sid';
const SECURITY_CONTEXT_KEY = Symbol('security-request-context');
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function parseCookieHeader(cookieHeader: string | undefined) {
  const cookies = new Map<string, string>();

  for (const segment of (cookieHeader || '').split(';')) {
    const [rawName, ...valueParts] = segment.split('=');
    const name = rawName?.trim();
    if (!name) {
      continue;
    }

    cookies.set(name, decodeURIComponent(valueParts.join('=').trim()));
  }

  return cookies;
}

function appendSetCookieHeader(existingValue: string | string[] | undefined, nextValue: string) {
  if (!existingValue) {
    return nextValue;
  }

  if (Array.isArray(existingValue)) {
    return [...existingValue, nextValue];
  }

  return [existingValue, nextValue];
}

function writeSetCookie(event: any, cookieValue: string) {
  const response = event?.node?.res;
  if (!response?.setHeader || !response?.getHeader) {
    return;
  }

  const existingValue = response.getHeader('set-cookie') as string | string[] | undefined;
  response.setHeader('set-cookie', appendSetCookieHeader(existingValue, cookieValue));
}

function setResponseHeader(event: any, name: string, value: string) {
  event?.node?.res?.setHeader?.(name, value);
}

function resolveClientIp(event: any) {
  const forwardedFor = event?.node?.req?.headers?.['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const primaryForwardedIp = forwardedValue?.split(',')[0]?.trim();

  if (primaryForwardedIp) {
    return primaryForwardedIp;
  }

  const realIp = event?.node?.req?.headers?.['x-real-ip'];
  const normalizedRealIp = Array.isArray(realIp) ? realIp[0] : realIp;
  if (typeof normalizedRealIp === 'string' && normalizedRealIp.trim()) {
    return normalizedRealIp.trim();
  }

  return event?.node?.req?.socket?.remoteAddress || '127.0.0.1';
}

function maskClientIp(ip: string) {
  if (ip.includes('.')) {
    const segments = ip.split('.');
    if (segments.length === 4) {
      return `${segments[0]}.${segments[1]}.${segments[2]}.*`;
    }
  }

  if (ip.includes(':')) {
    return `${ip.split(':').slice(0, 4).join(':')}::*`;
  }

  return ip;
}

function hashIdentityValue(hashSalt: string, value: string) {
  return createHash('sha256').update(`${hashSalt}:${value}`).digest('hex');
}

function readSecuritySessionId(event: any) {
  const cookieHeader = event?.node?.req?.headers?.cookie;
  const normalizedCookieHeader = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader;
  return parseCookieHeader(normalizedCookieHeader).get(SECURITY_SESSION_COOKIE) || '';
}

function persistSecuritySessionId(event: any, sessionId: string) {
  writeSetCookie(
    event,
    `${SECURITY_SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Max-Age=${ONE_YEAR_IN_SECONDS}; Path=/; HttpOnly; SameSite=Lax`,
  );
}

export function createSecurityRequestService(input: {
  hashSalt: string;
  turnstileSecretKey: string;
  generateSessionId?: () => string;
  rateLimitService: {
    consumeLimit(payload: {
      action: string;
      identity: { ipHash: string; sessionHash: string };
      policy: { windowMs: number; limits: { ip: number; session: number } };
    }): Promise<{ allowed: boolean; dimension?: 'ip' | 'session'; retryAfterSeconds?: number }>;
  };
  authSecurityService: {
    assertAllowed(payload: {
      identity: { ipHash: string; sessionHash: string; ipLabel: string; sessionLabel: string };
      settings: { windowMs: number; cooldownMs: number; maxFailures: number };
    }): Promise<{ allowed: boolean; dimension?: 'ip' | 'session'; retryAfterSeconds?: number }>;
    registerFailure(payload: {
      identity: { ipHash: string; sessionHash: string; ipLabel: string; sessionLabel: string };
      settings: { windowMs: number; cooldownMs: number; maxFailures: number };
    }): Promise<{ cooldownTriggered: boolean; retryAfterSeconds?: number; remainingAttempts: number }>;
    clearFailures(payload: {
      identity: { ipHash: string; sessionHash: string; ipLabel: string; sessionLabel: string };
    }): Promise<void>;
  };
  turnstileService: {
    verifyToken(payload: {
      enabled: boolean;
      secretKey: string;
      token: string;
      remoteIp?: string;
    }): Promise<unknown>;
  };
}) {
  const generateSessionId = input.generateSessionId ?? (() => `session-${randomUUID()}`);
  const hashSalt = input.hashSalt.trim() || 'blog2-security';
  const turnstileSecretKey = input.turnstileSecretKey.trim();

  async function resolveRequestContext(event: any) {
    if (event?.[SECURITY_CONTEXT_KEY]) {
      return event[SECURITY_CONTEXT_KEY];
    }

    const ip = resolveClientIp(event);
    let sessionId = readSecuritySessionId(event);

    if (!sessionId) {
      sessionId = generateSessionId();
      persistSecuritySessionId(event, sessionId);
    }

    const context = {
      ip,
      sessionId,
      ipLabel: maskClientIp(ip),
      sessionLabel: `session:${sessionId.slice(0, 8)}`,
      identity: {
        ipHash: hashIdentityValue(hashSalt, ip),
        sessionHash: hashIdentityValue(hashSalt, sessionId),
      },
    };

    if (event && typeof event === 'object') {
      event[SECURITY_CONTEXT_KEY] = context;
    }

    return context;
  }

  function throwTooManyRequests(message: string, retryAfterSeconds?: number): never {
    if (retryAfterSeconds) {
      throw createError({
        statusCode: 429,
        statusMessage: message,
        data: { retryAfterSeconds },
      });
    }

    throw createError({
      statusCode: 429,
      statusMessage: message,
    });
  }

  return {
    resolveRequestContext,
    async consumeRateLimit(event: any, payload: {
      action: string;
      policy: { windowMs: number; limits: { ip: number; session: number } };
      blockedMessage: string;
    }) {
      const requestContext = await resolveRequestContext(event);
      const result = await input.rateLimitService.consumeLimit({
        action: payload.action,
        identity: requestContext.identity,
        policy: payload.policy,
      });

      if (!result.allowed) {
        if (result.retryAfterSeconds) {
          setResponseHeader(event, 'Retry-After', String(result.retryAfterSeconds));
        }

        throwTooManyRequests(payload.blockedMessage, result.retryAfterSeconds);
      }

      return requestContext;
    },
    async verifyTurnstile(event: any, payload: { enabled: boolean; token?: string | null }) {
      const requestContext = await resolveRequestContext(event);

      return await input.turnstileService.verifyToken({
        enabled: payload.enabled,
        secretKey: turnstileSecretKey,
        token: payload.token?.trim() || '',
        remoteIp: requestContext.ip,
      });
    },
    async assertLoginAllowed(event: any, settings: { windowMs: number; cooldownMs: number; maxFailures: number }) {
      const requestContext = await resolveRequestContext(event);
      const result = await input.authSecurityService.assertAllowed({
        identity: {
          ...requestContext.identity,
          ipLabel: requestContext.ipLabel,
          sessionLabel: requestContext.sessionLabel,
        },
        settings,
      });

      if (!result.allowed) {
        if (result.retryAfterSeconds) {
          setResponseHeader(event, 'Retry-After', String(result.retryAfterSeconds));
        }

        throwTooManyRequests('登录失败次数过多，请稍后再试', result.retryAfterSeconds);
      }

      return requestContext;
    },
    async registerLoginFailure(event: any, settings: { windowMs: number; cooldownMs: number; maxFailures: number }) {
      const requestContext = await resolveRequestContext(event);
      const result = await input.authSecurityService.registerFailure({
        identity: {
          ...requestContext.identity,
          ipLabel: requestContext.ipLabel,
          sessionLabel: requestContext.sessionLabel,
        },
        settings,
      });

      if (result.cooldownTriggered && result.retryAfterSeconds) {
        setResponseHeader(event, 'Retry-After', String(result.retryAfterSeconds));
        throwTooManyRequests('登录失败次数过多，请稍后再试', result.retryAfterSeconds);
      }

      return result;
    },
    async clearLoginFailures(event: any) {
      const requestContext = await resolveRequestContext(event);
      await input.authSecurityService.clearFailures({
        identity: {
          ...requestContext.identity,
          ipLabel: requestContext.ipLabel,
          sessionLabel: requestContext.sessionLabel,
        },
      });
    },
  };
}

let securityRequestServiceInstance: ReturnType<typeof createSecurityRequestService> | null = null;

export function useSecurityRequestService() {
  if (!securityRequestServiceInstance) {
    const runtimeConfig = useRuntimeConfig();
    const repository = {
      findState: findSecurityThrottleState,
      saveState: saveSecurityThrottleState,
      deleteStatesByAction: deleteSecurityThrottleStatesByAction,
      createAlert: createSecurityAlert,
    };

    securityRequestServiceInstance = createSecurityRequestService({
      hashSalt: runtimeConfig.securityHashSalt || runtimeConfig.session.password,
      turnstileSecretKey: runtimeConfig.turnstileSecretKey || '',
      rateLimitService: createSecurityRateLimitService({ repository }),
      authSecurityService: createAuthSecurityService({ repository }),
      turnstileService: createTurnstileVerificationService({}),
    });
  }

  return securityRequestServiceInstance;
}

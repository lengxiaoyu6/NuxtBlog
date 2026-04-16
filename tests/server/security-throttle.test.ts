import { describe, expect, it } from 'vitest';

type SecurityDimension = 'ip' | 'session';

type SecurityThrottleStateRecord = {
  action: string;
  dimension: SecurityDimension;
  subjectHash: string;
  hits: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
  updatedAt: Date;
};

function createInMemoryRepository() {
  const records = new Map<string, SecurityThrottleStateRecord>();

  return {
    async findState(input: { action: string; dimension: SecurityDimension; subjectHash: string }) {
      return records.get(`${input.action}:${input.dimension}:${input.subjectHash}`) ?? null;
    },
    async saveState(input: SecurityThrottleStateRecord) {
      records.set(`${input.action}:${input.dimension}:${input.subjectHash}`, { ...input });
    },
  };
}

async function loadRateLimitModule() {
  try {
    return await import('../../server/services/security-rate-limit.service');
  }
  catch {
    return null;
  }
}

describe('createSecurityRateLimitService', () => {
  it('blocks requests after the ip window limit is exceeded', async () => {
    const mod = await loadRateLimitModule();
    expect(mod).not.toBeNull();

    const now = new Date('2026-04-17T02:00:00.000Z');
    const repository = createInMemoryRepository();
    const service = mod!.createSecurityRateLimitService({
      repository,
      now: () => now,
    });

    const first = await service.consumeLimit({
      action: 'comment_submit',
      identity: {
        ipHash: 'ip-a',
        sessionHash: 'session-a',
      },
      policy: {
        windowMs: 60_000,
        limits: {
          ip: 1,
          session: 3,
        },
      },
    });

    const second = await service.consumeLimit({
      action: 'comment_submit',
      identity: {
        ipHash: 'ip-a',
        sessionHash: 'session-a',
      },
      policy: {
        windowMs: 60_000,
        limits: {
          ip: 1,
          session: 3,
        },
      },
    });

    expect(first).toMatchObject({ allowed: true });
    expect(second).toMatchObject({
      allowed: false,
      dimension: 'ip',
      retryAfterSeconds: 60,
    });
  });

  it('blocks requests when the session limit is exceeded even if the ip limit is still available', async () => {
    const mod = await loadRateLimitModule();
    expect(mod).not.toBeNull();

    const now = new Date('2026-04-17T02:10:00.000Z');
    const repository = createInMemoryRepository();
    const service = mod!.createSecurityRateLimitService({
      repository,
      now: () => now,
    });

    await service.consumeLimit({
      action: 'guestbook_submit',
      identity: {
        ipHash: 'ip-b',
        sessionHash: 'session-b',
      },
      policy: {
        windowMs: 120_000,
        limits: {
          ip: 5,
          session: 1,
        },
      },
    });

    const blocked = await service.consumeLimit({
      action: 'guestbook_submit',
      identity: {
        ipHash: 'ip-b',
        sessionHash: 'session-b',
      },
      policy: {
        windowMs: 120_000,
        limits: {
          ip: 5,
          session: 1,
        },
      },
    });

    expect(blocked).toMatchObject({
      allowed: false,
      dimension: 'session',
      retryAfterSeconds: 120,
    });
  });

  it('resets the counter after the time window expires', async () => {
    const mod = await loadRateLimitModule();
    expect(mod).not.toBeNull();

    let currentTime = new Date('2026-04-17T03:00:00.000Z');
    const repository = createInMemoryRepository();
    const service = mod!.createSecurityRateLimitService({
      repository,
      now: () => currentTime,
    });

    await service.consumeLimit({
      action: 'post_like',
      identity: {
        ipHash: 'ip-c',
        sessionHash: 'session-c',
      },
      policy: {
        windowMs: 30_000,
        limits: {
          ip: 1,
          session: 1,
        },
      },
    });

    currentTime = new Date('2026-04-17T03:00:31.000Z');

    const nextAttempt = await service.consumeLimit({
      action: 'post_like',
      identity: {
        ipHash: 'ip-c',
        sessionHash: 'session-c',
      },
      policy: {
        windowMs: 30_000,
        limits: {
          ip: 1,
          session: 1,
        },
      },
    });

    expect(nextAttempt).toMatchObject({ allowed: true });
  });
});

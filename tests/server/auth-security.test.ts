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

type SecurityAlertRecord = {
  dedupeKey: string;
  dimension: SecurityDimension;
  createdAt: Date;
  blockedUntil: Date | null;
};

function createInMemoryRepository() {
  const states = new Map<string, SecurityThrottleStateRecord>();
  const alerts = new Map<string, SecurityAlertRecord>();

  return {
    alerts,
    async findState(input: { action: string; dimension: SecurityDimension; subjectHash: string }) {
      return states.get(`${input.action}:${input.dimension}:${input.subjectHash}`) ?? null;
    },
    async saveState(input: SecurityThrottleStateRecord) {
      states.set(`${input.action}:${input.dimension}:${input.subjectHash}`, { ...input });
    },
    async deleteStatesByAction(input: { action: string; subjects: Array<{ dimension: SecurityDimension; subjectHash: string }> }) {
      for (const subject of input.subjects) {
        states.delete(`${input.action}:${subject.dimension}:${subject.subjectHash}`);
      }
    },
    async createAlert(input: SecurityAlertRecord) {
      if (!alerts.has(input.dedupeKey)) {
        alerts.set(input.dedupeKey, { ...input });
      }
    },
  };
}

async function loadAuthSecurityModule() {
  try {
    return await import('../../server/services/auth-security.service');
  }
  catch {
    return null;
  }
}

describe('createAuthSecurityService', () => {
  it('tracks failed logins and enters cooldown after the configured threshold', async () => {
    const mod = await loadAuthSecurityModule();
    expect(mod).not.toBeNull();

    const repository = createInMemoryRepository();
    let currentTime = new Date('2026-04-17T04:00:00.000Z');
    const service = mod!.createAuthSecurityService({
      repository,
      now: () => currentTime,
    });
    const settings = {
      windowMs: 10 * 60_000,
      cooldownMs: 15 * 60_000,
      maxFailures: 3,
    };
    const identity = {
      ipHash: 'ip-login',
      sessionHash: 'session-login',
      ipLabel: '127.0.0.*',
      sessionLabel: 'session:abcd1234',
    };

    const first = await service.registerFailure({ identity, settings });
    const second = await service.registerFailure({ identity, settings });
    const third = await service.registerFailure({ identity, settings });

    expect(first).toMatchObject({ cooldownTriggered: false, remainingAttempts: 2 });
    expect(second).toMatchObject({ cooldownTriggered: false, remainingAttempts: 1 });
    expect(third).toMatchObject({
      cooldownTriggered: true,
      retryAfterSeconds: 15 * 60,
    });

    const blocked = await service.assertAllowed({ identity, settings });
    expect(blocked).toMatchObject({
      allowed: false,
      retryAfterSeconds: 15 * 60,
    });
  });

  it('clears failure counters after a successful login', async () => {
    const mod = await loadAuthSecurityModule();
    expect(mod).not.toBeNull();

    const repository = createInMemoryRepository();
    const service = mod!.createAuthSecurityService({
      repository,
      now: () => new Date('2026-04-17T05:00:00.000Z'),
    });
    const settings = {
      windowMs: 5 * 60_000,
      cooldownMs: 10 * 60_000,
      maxFailures: 3,
    };
    const identity = {
      ipHash: 'ip-reset',
      sessionHash: 'session-reset',
      ipLabel: '127.0.0.*',
      sessionLabel: 'session:reset',
    };

    await service.registerFailure({ identity, settings });
    await service.registerFailure({ identity, settings });
    await service.clearFailures({ identity });

    const status = await service.assertAllowed({ identity, settings });
    expect(status).toMatchObject({ allowed: true });
  });

  it('deduplicates alerts while the same cooldown window is active', async () => {
    const mod = await loadAuthSecurityModule();
    expect(mod).not.toBeNull();

    const repository = createInMemoryRepository();
    let currentTime = new Date('2026-04-17T06:00:00.000Z');
    const service = mod!.createAuthSecurityService({
      repository,
      now: () => currentTime,
    });
    const settings = {
      windowMs: 10 * 60_000,
      cooldownMs: 20 * 60_000,
      maxFailures: 1,
    };
    const identity = {
      ipHash: 'ip-alert',
      sessionHash: 'session-alert',
      ipLabel: '127.0.0.*',
      sessionLabel: 'session:alert',
    };

    await service.registerFailure({ identity, settings });
    expect(repository.alerts.size).toBe(2);

    currentTime = new Date('2026-04-17T06:05:00.000Z');
    await service.registerFailure({ identity, settings });
    expect(repository.alerts.size).toBe(2);
  });
});

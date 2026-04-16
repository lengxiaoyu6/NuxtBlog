export type SecurityDimension = 'ip' | 'session';

export interface SecurityThrottleStateRecord {
  action: string;
  dimension: SecurityDimension;
  subjectHash: string;
  hits: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
  updatedAt: Date;
}

export interface SecurityRateLimitRepository {
  findState(input: { action: string; dimension: SecurityDimension; subjectHash: string }): Promise<SecurityThrottleStateRecord | null>;
  saveState(input: SecurityThrottleStateRecord): Promise<void>;
}

export interface SecurityRateLimitIdentity {
  ipHash: string;
  sessionHash: string;
}

export interface SecurityRateLimitPolicy {
  windowMs: number;
  limits: Record<SecurityDimension, number>;
}

export interface SecurityRateLimitResult {
  allowed: boolean;
  dimension?: SecurityDimension;
  retryAfterSeconds?: number;
}

function toRetryAfterSeconds(retryAfterMs: number) {
  return Math.max(1, Math.ceil(retryAfterMs / 1000));
}

function cloneState(record: SecurityThrottleStateRecord) {
  return {
    ...record,
    windowStartedAt: new Date(record.windowStartedAt),
    blockedUntil: record.blockedUntil ? new Date(record.blockedUntil) : null,
    updatedAt: new Date(record.updatedAt),
  } satisfies SecurityThrottleStateRecord;
}

function resetWindow(record: SecurityThrottleStateRecord, now: Date) {
  return {
    ...record,
    hits: 0,
    windowStartedAt: new Date(now),
    blockedUntil: null,
    updatedAt: new Date(now),
  } satisfies SecurityThrottleStateRecord;
}

function createEmptyState(input: { action: string; dimension: SecurityDimension; subjectHash: string; now: Date }) {
  return {
    action: input.action,
    dimension: input.dimension,
    subjectHash: input.subjectHash,
    hits: 0,
    windowStartedAt: new Date(input.now),
    blockedUntil: null,
    updatedAt: new Date(input.now),
  } satisfies SecurityThrottleStateRecord;
}

export function createSecurityRateLimitService(input: {
  repository: SecurityRateLimitRepository;
  now?: () => Date;
}) {
  const now = input.now ?? (() => new Date());

  async function consumeDimensionLimit(payload: {
    action: string;
    dimension: SecurityDimension;
    subjectHash: string;
    limit: number;
    windowMs: number;
  }): Promise<SecurityRateLimitResult> {
    const currentTime = now();
    const existingRecord = await input.repository.findState({
      action: payload.action,
      dimension: payload.dimension,
      subjectHash: payload.subjectHash,
    });

    let record = existingRecord ? cloneState(existingRecord) : createEmptyState({
      action: payload.action,
      dimension: payload.dimension,
      subjectHash: payload.subjectHash,
      now: currentTime,
    });

    if (record.blockedUntil && record.blockedUntil.getTime() > currentTime.getTime()) {
      return {
        allowed: false,
        dimension: payload.dimension,
        retryAfterSeconds: toRetryAfterSeconds(record.blockedUntil.getTime() - currentTime.getTime()),
      };
    }

    if (currentTime.getTime() - record.windowStartedAt.getTime() >= payload.windowMs) {
      record = resetWindow(record, currentTime);
    }

    const nextHits = record.hits + 1;
    const nextBlockedUntil = nextHits > payload.limit
      ? new Date(record.windowStartedAt.getTime() + payload.windowMs)
      : null;

    await input.repository.saveState({
      ...record,
      hits: nextHits,
      blockedUntil: nextBlockedUntil,
      updatedAt: new Date(currentTime),
    });

    if (nextBlockedUntil) {
      return {
        allowed: false,
        dimension: payload.dimension,
        retryAfterSeconds: toRetryAfterSeconds(nextBlockedUntil.getTime() - currentTime.getTime()),
      };
    }

    return { allowed: true };
  }

  return {
    async consumeLimit(payload: {
      action: string;
      identity: SecurityRateLimitIdentity;
      policy: SecurityRateLimitPolicy;
    }): Promise<SecurityRateLimitResult> {
      const ipResult = await consumeDimensionLimit({
        action: payload.action,
        dimension: 'ip',
        subjectHash: payload.identity.ipHash,
        limit: payload.policy.limits.ip,
        windowMs: payload.policy.windowMs,
      });

      if (!ipResult.allowed) {
        return ipResult;
      }

      const sessionResult = await consumeDimensionLimit({
        action: payload.action,
        dimension: 'session',
        subjectHash: payload.identity.sessionHash,
        limit: payload.policy.limits.session,
        windowMs: payload.policy.windowMs,
      });

      if (!sessionResult.allowed) {
        return sessionResult;
      }

      return { allowed: true };
    },
  };
}

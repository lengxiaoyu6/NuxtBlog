export type SecurityDimension = 'ip' | 'session';

export interface AuthSecurityThrottleStateRecord {
  action: string;
  dimension: SecurityDimension;
  subjectHash: string;
  hits: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
  updatedAt: Date;
}

export interface AuthSecurityAlertRecord {
  dedupeKey: string;
  dimension: SecurityDimension;
  createdAt: Date;
  blockedUntil: Date | null;
}

export interface AuthSecurityRepository {
  findState(input: { action: string; dimension: SecurityDimension; subjectHash: string }): Promise<AuthSecurityThrottleStateRecord | null>;
  saveState(input: AuthSecurityThrottleStateRecord): Promise<void>;
  deleteStatesByAction(input: { action: string; subjects: Array<{ dimension: SecurityDimension; subjectHash: string }> }): Promise<void>;
  createAlert(input: AuthSecurityAlertRecord): Promise<void>;
}

export interface AuthSecuritySettings {
  windowMs: number;
  cooldownMs: number;
  maxFailures: number;
}

export interface AuthSecurityIdentity {
  ipHash: string;
  sessionHash: string;
  ipLabel: string;
  sessionLabel: string;
}

const LOGIN_FAILURE_ACTION = 'auth_login_failure';

function toRetryAfterSeconds(retryAfterMs: number) {
  return Math.max(1, Math.ceil(retryAfterMs / 1000));
}

function cloneState(record: AuthSecurityThrottleStateRecord) {
  return {
    ...record,
    windowStartedAt: new Date(record.windowStartedAt),
    blockedUntil: record.blockedUntil ? new Date(record.blockedUntil) : null,
    updatedAt: new Date(record.updatedAt),
  } satisfies AuthSecurityThrottleStateRecord;
}

function createEmptyState(input: { dimension: SecurityDimension; subjectHash: string; now: Date }) {
  return {
    action: LOGIN_FAILURE_ACTION,
    dimension: input.dimension,
    subjectHash: input.subjectHash,
    hits: 0,
    windowStartedAt: new Date(input.now),
    blockedUntil: null,
    updatedAt: new Date(input.now),
  } satisfies AuthSecurityThrottleStateRecord;
}

function buildSubjects(identity: AuthSecurityIdentity) {
  return [
    { dimension: 'ip' as const, subjectHash: identity.ipHash, label: identity.ipLabel },
    { dimension: 'session' as const, subjectHash: identity.sessionHash, label: identity.sessionLabel },
  ];
}

export function createAuthSecurityService(input: {
  repository: AuthSecurityRepository;
  now?: () => Date;
}) {
  const now = input.now ?? (() => new Date());

  async function loadState(dimension: SecurityDimension, subjectHash: string) {
    const record = await input.repository.findState({
      action: LOGIN_FAILURE_ACTION,
      dimension,
      subjectHash,
    });

    return record ? cloneState(record) : null;
  }

  return {
    async assertAllowed(payload: {
      identity: AuthSecurityIdentity;
      settings: AuthSecuritySettings;
    }) {
      const currentTime = now();

      for (const subject of buildSubjects(payload.identity)) {
        const record = await loadState(subject.dimension, subject.subjectHash);
        if (!record?.blockedUntil || record.blockedUntil.getTime() <= currentTime.getTime()) {
          continue;
        }

        return {
          allowed: false,
          dimension: subject.dimension,
          retryAfterSeconds: toRetryAfterSeconds(record.blockedUntil.getTime() - currentTime.getTime()),
          label: subject.label,
        };
      }

      return { allowed: true };
    },

    async registerFailure(payload: {
      identity: AuthSecurityIdentity;
      settings: AuthSecuritySettings;
    }) {
      const currentTime = now();
      let retryAfterSeconds = 0;
      let cooldownTriggered = false;
      let remainingAttempts = payload.settings.maxFailures;

      for (const subject of buildSubjects(payload.identity)) {
        const existingRecord = await loadState(subject.dimension, subject.subjectHash);
        let record = existingRecord ?? createEmptyState({
          dimension: subject.dimension,
          subjectHash: subject.subjectHash,
          now: currentTime,
        });

        if (currentTime.getTime() - record.windowStartedAt.getTime() >= payload.settings.windowMs) {
          record = {
            ...record,
            hits: 0,
            windowStartedAt: new Date(currentTime),
            blockedUntil: null,
            updatedAt: new Date(currentTime),
          };
        }

        if (record.blockedUntil && record.blockedUntil.getTime() > currentTime.getTime()) {
          cooldownTriggered = true;
          retryAfterSeconds = Math.max(
            retryAfterSeconds,
            toRetryAfterSeconds(record.blockedUntil.getTime() - currentTime.getTime()),
          );

          await input.repository.createAlert({
            dedupeKey: `${LOGIN_FAILURE_ACTION}:${subject.dimension}:${subject.subjectHash}:${record.blockedUntil.toISOString()}`,
            dimension: subject.dimension,
            createdAt: new Date(currentTime),
            blockedUntil: new Date(record.blockedUntil),
          });
          continue;
        }

        const nextHits = record.hits + 1;
        const blockedUntil = nextHits >= payload.settings.maxFailures
          ? new Date(currentTime.getTime() + payload.settings.cooldownMs)
          : null;

        await input.repository.saveState({
          ...record,
          hits: nextHits,
          blockedUntil,
          updatedAt: new Date(currentTime),
        });

        remainingAttempts = Math.min(remainingAttempts, Math.max(payload.settings.maxFailures - nextHits, 0));

        if (blockedUntil) {
          cooldownTriggered = true;
          retryAfterSeconds = Math.max(
            retryAfterSeconds,
            toRetryAfterSeconds(blockedUntil.getTime() - currentTime.getTime()),
          );
          await input.repository.createAlert({
            dedupeKey: `${LOGIN_FAILURE_ACTION}:${subject.dimension}:${subject.subjectHash}:${blockedUntil.toISOString()}`,
            dimension: subject.dimension,
            createdAt: new Date(currentTime),
            blockedUntil,
          });
        }
      }

      return {
        cooldownTriggered,
        retryAfterSeconds: cooldownTriggered ? retryAfterSeconds : undefined,
        remainingAttempts,
      };
    },

    async clearFailures(payload: { identity: AuthSecurityIdentity }) {
      await input.repository.deleteStatesByAction({
        action: LOGIN_FAILURE_ACTION,
        subjects: buildSubjects(payload.identity).map((subject) => ({
          dimension: subject.dimension,
          subjectHash: subject.subjectHash,
        })),
      });
    },
  };
}

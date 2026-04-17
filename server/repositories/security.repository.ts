import type { SecurityDimension } from '../services/security-rate-limit.service';
import { usePrismaClient } from '../utils/prisma';

export async function findSecurityThrottleState(input: {
  action: string;
  dimension: SecurityDimension;
  subjectHash: string;
}) {
  return usePrismaClient().securityThrottleState.findUnique({
    where: {
      action_dimension_subjectHash: {
        action: input.action,
        dimension: input.dimension,
        subjectHash: input.subjectHash,
      },
    },
  });
}

export async function saveSecurityThrottleState(input: {
  action: string;
  dimension: SecurityDimension;
  subjectHash: string;
  hits: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
  updatedAt: Date;
}) {
  await usePrismaClient().securityThrottleState.upsert({
    where: {
      action_dimension_subjectHash: {
        action: input.action,
        dimension: input.dimension,
        subjectHash: input.subjectHash,
      },
    },
    create: {
      action: input.action,
      dimension: input.dimension,
      subjectHash: input.subjectHash,
      hits: input.hits,
      windowStartedAt: input.windowStartedAt,
      blockedUntil: input.blockedUntil,
      updatedAt: input.updatedAt,
    },
    update: {
      hits: input.hits,
      windowStartedAt: input.windowStartedAt,
      blockedUntil: input.blockedUntil,
      updatedAt: input.updatedAt,
    },
  });
}

export async function deleteSecurityThrottleStatesByAction(input: {
  action: string;
  subjects: Array<{ dimension: SecurityDimension; subjectHash: string }>;
}) {
  if (!input.subjects.length) {
    return;
  }

  await usePrismaClient().securityThrottleState.deleteMany({
    where: {
      action: input.action,
      OR: input.subjects.map((subject) => ({
        dimension: subject.dimension,
        subjectHash: subject.subjectHash,
      })),
    },
  });
}

export async function createSecurityAlert(input: {
  dedupeKey: string;
  dimension: SecurityDimension;
  createdAt: Date;
  blockedUntil: Date | null;
}) {
  await usePrismaClient().securityAlert.upsert({
    where: {
      dedupeKey: input.dedupeKey,
    },
    create: {
      dedupeKey: input.dedupeKey,
      dimension: input.dimension,
      createdAt: input.createdAt,
      blockedUntil: input.blockedUntil,
    },
    update: {},
  });
}

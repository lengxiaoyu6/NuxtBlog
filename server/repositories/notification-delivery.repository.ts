import type { Prisma } from '@prisma/client';
import { usePrismaClient } from '../utils/prisma';

export interface CreateQueuedNotificationDeliveryRecordInput {
  eventName: string;
  recipients: string[];
  subject: string;
  bodyText: string;
  payload: Record<string, unknown>;
  queuedAt: Date;
}

function toJsonValue(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

export async function createQueuedNotificationDeliveryRecord(input: CreateQueuedNotificationDeliveryRecordInput) {
  return usePrismaClient().notificationDelivery.create({
    data: {
      eventName: input.eventName,
      status: 'queued',
      recipientsJson: input.recipients,
      subject: input.subject,
      bodyText: input.bodyText,
      payloadJson: toJsonValue(input.payload),
      queuedAt: input.queuedAt,
    },
  });
}

export async function markNotificationDeliveryAsSent(id: string, sentAt: Date) {
  return usePrismaClient().notificationDelivery.update({
    where: {
      id,
    },
    data: {
      status: 'sent',
      attempts: {
        increment: 1,
      },
      lastErrorMessage: null,
      sentAt,
    },
  });
}

export async function markNotificationDeliveryAsFailed(id: string, errorMessage: string, _failedAt: Date) {
  return usePrismaClient().notificationDelivery.update({
    where: {
      id,
    },
    data: {
      status: 'failed',
      attempts: {
        increment: 1,
      },
      lastErrorMessage: errorMessage,
    },
  });
}

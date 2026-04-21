import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../../../server/utils/prisma', () => ({
  usePrismaClient: () => ({
    notificationDelivery: {
      create: mocks.create,
      update: mocks.update,
    },
  }),
}));

describe('notification delivery repository', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('creates a queued delivery record', async () => {
    const repository = await import('../../../server/repositories/notification-delivery.repository');
    const queuedAt = new Date('2026-04-20T12:00:00.000Z');

    await repository.createQueuedNotificationDeliveryRecord({
      eventName: 'blog:comment:created',
      recipients: ['admin@example.com', 'ops@example.com'],
      subject: '[Blog 通知] 新评论待审核：测试文章',
      bodyText: '邮件正文',
      payload: {
        id: 'comment-1',
      },
      queuedAt,
    });

    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        eventName: 'blog:comment:created',
        status: 'queued',
        recipientsJson: ['admin@example.com', 'ops@example.com'],
        subject: '[Blog 通知] 新评论待审核：测试文章',
        bodyText: '邮件正文',
        payloadJson: {
          id: 'comment-1',
        },
        queuedAt,
      },
    });
  });

  it('marks a delivery record as sent', async () => {
    const repository = await import('../../../server/repositories/notification-delivery.repository');
    const sentAt = new Date('2026-04-20T12:02:00.000Z');

    await repository.markNotificationDeliveryAsSent('delivery-1', sentAt);

    expect(mocks.update).toHaveBeenCalledWith({
      where: {
        id: 'delivery-1',
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
  });

  it('marks a delivery record as failed', async () => {
    const repository = await import('../../../server/repositories/notification-delivery.repository');
    const failedAt = new Date('2026-04-20T12:02:00.000Z');

    await repository.markNotificationDeliveryAsFailed('delivery-1', 'SMTP 认证失败', failedAt);

    expect(mocks.update).toHaveBeenCalledWith({
      where: {
        id: 'delivery-1',
      },
      data: {
        status: 'failed',
        attempts: {
          increment: 1,
        },
        lastErrorMessage: 'SMTP 认证失败',
      },
    });
  });
});

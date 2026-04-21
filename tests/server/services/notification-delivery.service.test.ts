import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTIFICATION_HOOK_NAMES } from '../../../server/services/notification-event.service';

const queuedAt = new Date('2026-04-20T12:00:00.000Z');
const sentAt = new Date('2026-04-20T12:00:30.000Z');

function createNotificationSettings(overrides: Record<string, unknown> = {}) {
  return {
    enabled: true,
    subjectPrefix: '[Blog 通知]',
    adminRecipients: ['admin@example.com', 'ops@example.com'],
    smtp: {
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      username: 'notify@example.com',
      password: 'smtp-password-123',
      fromName: 'Blog Notice',
      fromEmail: 'notify@example.com',
      replyToEmail: 'reply@example.com',
    },
    events: {
      postCommentCreated: true,
      postCommentReply: true,
      guestbookCreated: true,
    },
    ...overrides,
  };
}

describe('notification delivery service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('queues and sends an email for an enabled comment creation event', async () => {
    const { createNotificationDeliveryService } = await import('../../../server/services/notification-delivery.service');
    const createQueuedNotificationDeliveryRecord = vi.fn().mockResolvedValue({
      id: 'delivery-1',
      queuedAt,
    });
    const markNotificationDeliveryAsSent = vi.fn().mockResolvedValue(undefined);
    const markNotificationDeliveryAsFailed = vi.fn().mockResolvedValue(undefined);
    const emitDeliveryQueued = vi.fn();
    const emitDeliverySent = vi.fn();
    const emitDeliveryFailed = vi.fn();
    const sendMail = vi.fn().mockResolvedValue({ messageId: '<message-id@example.com>' });
    const createTransport = vi.fn().mockReturnValue({ sendMail });
    const now = vi.fn()
      .mockReturnValueOnce(queuedAt)
      .mockReturnValueOnce(sentAt);
    const service = createNotificationDeliveryService({
      readNotificationSettings: vi.fn().mockResolvedValue(createNotificationSettings()),
      createQueuedNotificationDeliveryRecord,
      markNotificationDeliveryAsSent,
      markNotificationDeliveryAsFailed,
      createTransport,
      emitDeliveryQueued,
      emitDeliverySent,
      emitDeliveryFailed,
      now,
    });

    await service.deliverNotificationEvent(NOTIFICATION_HOOK_NAMES.postCommentCreated, {
      id: 'comment-1',
      postId: 7,
      postTitle: '测试文章',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '评论内容',
      status: 'pending',
      submittedAt: '2026-04-20T11:59:00.000Z',
    });

    expect(createQueuedNotificationDeliveryRecord).toHaveBeenCalledWith(expect.objectContaining({
      eventName: NOTIFICATION_HOOK_NAMES.postCommentCreated,
      recipients: ['admin@example.com', 'ops@example.com'],
      subject: '[Blog 通知] 新评论待审核：测试文章',
      bodyText: expect.stringContaining('评论内容'),
      payload: expect.objectContaining({
        id: 'comment-1',
      }),
      queuedAt,
    }));
    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: {
        user: 'notify@example.com',
        pass: 'smtp-password-123',
      },
    });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: ['admin@example.com', 'ops@example.com'],
      subject: '[Blog 通知] 新评论待审核：测试文章',
      text: expect.stringContaining('测试用户'),
      replyTo: 'reply@example.com',
    }));
    expect(markNotificationDeliveryAsSent).toHaveBeenCalledWith('delivery-1', sentAt);
    expect(markNotificationDeliveryAsFailed).not.toHaveBeenCalled();
    expect(emitDeliveryQueued).toHaveBeenCalledWith({
      deliveryId: 'delivery-1',
      eventName: NOTIFICATION_HOOK_NAMES.postCommentCreated,
      recipients: ['admin@example.com', 'ops@example.com'],
      subject: '[Blog 通知] 新评论待审核：测试文章',
      queuedAt: queuedAt.toISOString(),
    });
    expect(emitDeliverySent).toHaveBeenCalledWith({
      deliveryId: 'delivery-1',
      eventName: NOTIFICATION_HOOK_NAMES.postCommentCreated,
      recipients: ['admin@example.com', 'ops@example.com'],
      subject: '[Blog 通知] 新评论待审核：测试文章',
      queuedAt: queuedAt.toISOString(),
      sentAt: sentAt.toISOString(),
    });
    expect(emitDeliveryFailed).not.toHaveBeenCalled();
  });

  it('queues and sends an email when a reply comment becomes approved', async () => {
    const { createNotificationDeliveryService } = await import('../../../server/services/notification-delivery.service');
    const createQueuedNotificationDeliveryRecord = vi.fn().mockResolvedValue({
      id: 'delivery-reply-1',
      queuedAt,
    });
    const markNotificationDeliveryAsSent = vi.fn().mockResolvedValue(undefined);
    const markNotificationDeliveryAsFailed = vi.fn().mockResolvedValue(undefined);
    const createTransport = vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: '<reply-message@example.com>' }),
    });
    const emitDeliveryQueued = vi.fn();
    const emitDeliverySent = vi.fn();
    const emitDeliveryFailed = vi.fn();
    const service = createNotificationDeliveryService({
      readNotificationSettings: vi.fn().mockResolvedValue(createNotificationSettings({
        adminRecipients: [],
      })),
      createQueuedNotificationDeliveryRecord,
      markNotificationDeliveryAsSent,
      markNotificationDeliveryAsFailed,
      createTransport,
      emitDeliveryQueued,
      emitDeliverySent,
      emitDeliveryFailed,
      now: vi.fn()
        .mockReturnValueOnce(queuedAt)
        .mockReturnValueOnce(sentAt),
    });

    await service.deliverNotificationEvent(NOTIFICATION_HOOK_NAMES.postCommentReviewed, {
      id: 'comment-2',
      postId: 7,
      postTitle: '测试文章',
      parentId: 'comment-1',
      parentAuthorEmail: 'parent@example.com',
      authorName: '二级访客',
      authorEmail: 'reply@example.com',
      authorRegion: '广东',
      content: '这是回复内容',
      previousStatus: 'pending',
      status: 'approved',
      submittedAt: '2026-04-20T11:59:00.000Z',
      reviewedAt: '2026-04-20T12:00:00.000Z',
    });

    expect(createQueuedNotificationDeliveryRecord).toHaveBeenCalledWith(expect.objectContaining({
      eventName: NOTIFICATION_HOOK_NAMES.postCommentReviewed,
      recipients: ['parent@example.com'],
      subject: '[Blog 通知] 评论收到新回复：测试文章',
      bodyText: expect.stringContaining('这是回复内容'),
    }));
    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(markNotificationDeliveryAsSent).toHaveBeenCalledWith('delivery-reply-1', sentAt);
    expect(markNotificationDeliveryAsFailed).not.toHaveBeenCalled();
  });

  it('skips reply delivery when the reply event switch is closed', async () => {
    const { createNotificationDeliveryService } = await import('../../../server/services/notification-delivery.service');
    const createQueuedNotificationDeliveryRecord = vi.fn();
    const createTransport = vi.fn();
    const service = createNotificationDeliveryService({
      readNotificationSettings: vi.fn().mockResolvedValue(createNotificationSettings({
        events: {
          postCommentCreated: true,
          postCommentReply: false,
          guestbookCreated: true,
        },
      })),
      createQueuedNotificationDeliveryRecord,
      createTransport,
      now: vi.fn().mockReturnValue(queuedAt),
    });

    await service.deliverNotificationEvent(NOTIFICATION_HOOK_NAMES.postCommentReviewed, {
      id: 'comment-2',
      postId: 7,
      postTitle: '测试文章',
      parentId: 'comment-1',
      parentAuthorEmail: 'parent@example.com',
      authorName: '二级访客',
      authorEmail: 'reply@example.com',
      authorRegion: '广东',
      content: '这是回复内容',
      previousStatus: 'pending',
      status: 'approved',
      submittedAt: '2026-04-20T11:59:00.000Z',
      reviewedAt: '2026-04-20T12:00:00.000Z',
    });

    expect(createQueuedNotificationDeliveryRecord).not.toHaveBeenCalled();
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('skips delivery when the current event switch is closed', async () => {
    const { createNotificationDeliveryService } = await import('../../../server/services/notification-delivery.service');
    const createQueuedNotificationDeliveryRecord = vi.fn();
    const createTransport = vi.fn();
    const service = createNotificationDeliveryService({
      readNotificationSettings: vi.fn().mockResolvedValue(createNotificationSettings({
        events: {
          postCommentCreated: true,
          guestbookCreated: false,
        },
      })),
      createQueuedNotificationDeliveryRecord,
      createTransport,
      now: vi.fn().mockReturnValue(queuedAt),
    });

    await service.deliverNotificationEvent(NOTIFICATION_HOOK_NAMES.guestbookReviewed, {
      id: 'guestbook-1',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '留言内容',
      previousStatus: 'pending',
      status: 'approved',
      submittedAt: '2026-04-20T11:59:00.000Z',
      reviewedAt: '2026-04-20T12:00:00.000Z',
    });

    expect(createQueuedNotificationDeliveryRecord).not.toHaveBeenCalled();
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('marks the queued delivery as failed when smtp delivery throws', async () => {
    const { createNotificationDeliveryService } = await import('../../../server/services/notification-delivery.service');
    const createQueuedNotificationDeliveryRecord = vi.fn().mockResolvedValue({
      id: 'delivery-1',
      queuedAt,
    });
    const markNotificationDeliveryAsSent = vi.fn().mockResolvedValue(undefined);
    const markNotificationDeliveryAsFailed = vi.fn().mockResolvedValue(undefined);
    const emitDeliveryQueued = vi.fn();
    const emitDeliverySent = vi.fn();
    const emitDeliveryFailed = vi.fn();
    const sendMail = vi.fn().mockRejectedValue(new Error('SMTP 认证失败'));
    const createTransport = vi.fn().mockReturnValue({ sendMail });
    const service = createNotificationDeliveryService({
      readNotificationSettings: vi.fn().mockResolvedValue(createNotificationSettings()),
      createQueuedNotificationDeliveryRecord,
      markNotificationDeliveryAsSent,
      markNotificationDeliveryAsFailed,
      createTransport,
      emitDeliveryQueued,
      emitDeliverySent,
      emitDeliveryFailed,
      now: vi.fn()
        .mockReturnValueOnce(queuedAt)
        .mockReturnValueOnce(sentAt),
    });

    await expect(service.deliverNotificationEvent(NOTIFICATION_HOOK_NAMES.guestbookCreated, {
      id: 'guestbook-1',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '留言内容',
      status: 'pending',
      submittedAt: '2026-04-20T11:59:00.000Z',
    })).rejects.toThrow('SMTP 认证失败');

    expect(markNotificationDeliveryAsSent).not.toHaveBeenCalled();
    expect(markNotificationDeliveryAsFailed).toHaveBeenCalledWith('delivery-1', 'SMTP 认证失败', sentAt);
    expect(emitDeliveryQueued).toHaveBeenCalledTimes(1);
    expect(emitDeliverySent).not.toHaveBeenCalled();
    expect(emitDeliveryFailed).toHaveBeenCalledWith({
      deliveryId: 'delivery-1',
      eventName: NOTIFICATION_HOOK_NAMES.guestbookCreated,
      recipients: ['admin@example.com', 'ops@example.com'],
      subject: '[Blog 通知] 新留言待审核',
      queuedAt: queuedAt.toISOString(),
      failedAt: sentAt.toISOString(),
      errorMessage: 'SMTP 认证失败',
    });
  });

  it('skips event delivery when the notification module is disabled', async () => {
    const { createNotificationDeliveryService } = await import('../../../server/services/notification-delivery.service');
    const createQueuedNotificationDeliveryRecord = vi.fn();
    const createTransport = vi.fn();
    const service = createNotificationDeliveryService({
      readNotificationSettings: vi.fn().mockResolvedValue(createNotificationSettings()),
      isNotificationModuleEnabled: vi.fn().mockResolvedValue(false),
      createQueuedNotificationDeliveryRecord,
      createTransport,
      now: vi.fn().mockReturnValue(queuedAt),
    });

    await service.deliverNotificationEvent(NOTIFICATION_HOOK_NAMES.postCommentCreated, {
      id: 'comment-1',
      postId: 7,
      postTitle: '测试文章',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '评论内容',
      status: 'pending',
      submittedAt: '2026-04-20T11:59:00.000Z',
    });

    expect(createQueuedNotificationDeliveryRecord).not.toHaveBeenCalled();
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('sends a notification test email with saved settings even when notification is disabled', async () => {
    const { createNotificationDeliveryService } = await import('../../../server/services/notification-delivery.service');
    const createQueuedNotificationDeliveryRecord = vi.fn().mockResolvedValue({
      id: 'delivery-test',
      queuedAt,
    });
    const markNotificationDeliveryAsSent = vi.fn().mockResolvedValue(undefined);
    const markNotificationDeliveryAsFailed = vi.fn().mockResolvedValue(undefined);
    const emitDeliveryQueued = vi.fn();
    const emitDeliverySent = vi.fn();
    const emitDeliveryFailed = vi.fn();
    const sendMail = vi.fn().mockResolvedValue({ messageId: '<message-id@example.com>' });
    const createTransport = vi.fn().mockReturnValue({ sendMail });
    const now = vi.fn()
      .mockReturnValueOnce(queuedAt)
      .mockReturnValueOnce(sentAt);
    const service = createNotificationDeliveryService({
      readNotificationSettings: vi.fn().mockResolvedValue(createNotificationSettings({
        enabled: false,
      })),
      createQueuedNotificationDeliveryRecord,
      markNotificationDeliveryAsSent,
      markNotificationDeliveryAsFailed,
      createTransport,
      emitDeliveryQueued,
      emitDeliverySent,
      emitDeliveryFailed,
      now,
    });

    await service.sendNotificationTestEmail('admin@example.com');

    expect(createQueuedNotificationDeliveryRecord).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'system:notification:test',
      recipients: ['admin@example.com'],
      subject: '[Blog 通知] 邮件配置测试',
      payload: {
        recipient: 'admin@example.com',
        triggeredAt: queuedAt.toISOString(),
      },
      queuedAt,
    }));
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: ['admin@example.com'],
      subject: '[Blog 通知] 邮件配置测试',
      text: expect.stringContaining('admin@example.com'),
      replyTo: 'reply@example.com',
    }));
    expect(markNotificationDeliveryAsSent).toHaveBeenCalledWith('delivery-test', sentAt);
    expect(markNotificationDeliveryAsFailed).not.toHaveBeenCalled();
    expect(emitDeliveryQueued).toHaveBeenCalledWith({
      deliveryId: 'delivery-test',
      eventName: 'system:notification:test',
      recipients: ['admin@example.com'],
      subject: '[Blog 通知] 邮件配置测试',
      queuedAt: queuedAt.toISOString(),
    });
    expect(emitDeliverySent).toHaveBeenCalledWith({
      deliveryId: 'delivery-test',
      eventName: 'system:notification:test',
      recipients: ['admin@example.com'],
      subject: '[Blog 通知] 邮件配置测试',
      queuedAt: queuedAt.toISOString(),
      sentAt: sentAt.toISOString(),
    });
    expect(emitDeliveryFailed).not.toHaveBeenCalled();
  });

  it('rejects a test recipient outside the saved admin recipients', async () => {
    const { createNotificationDeliveryService } = await import('../../../server/services/notification-delivery.service');
    const service = createNotificationDeliveryService({
      readNotificationSettings: vi.fn().mockResolvedValue(createNotificationSettings()),
    });

    await expect(service.sendNotificationTestEmail('other@example.com')).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: '测试收件邮箱必须来自已保存的管理员邮箱',
    });
  });

  it('rejects a test email when the saved smtp password is missing', async () => {
    const { createNotificationDeliveryService } = await import('../../../server/services/notification-delivery.service');
    const service = createNotificationDeliveryService({
      readNotificationSettings: vi.fn().mockResolvedValue(createNotificationSettings({
        smtp: {
          host: 'smtp.example.com',
          port: 465,
          secure: true,
          username: 'notify@example.com',
          password: '   ',
          fromName: 'Blog Notice',
          fromEmail: 'notify@example.com',
          replyToEmail: 'reply@example.com',
        },
      })),
    });

    await expect(service.sendNotificationTestEmail('admin@example.com')).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: '测试发信前必须先保存 SMTP 密码',
    });
  });
});

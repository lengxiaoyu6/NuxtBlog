import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
  callHook: vi.fn(),
}));

describe('notification event service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('useNitroApp', () => ({
      hooks: {
        callHook: hooks.callHook,
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('通过默认服务发布 Nitro hook 事件', async () => {
    const service = await import('../../../server/services/notification-event.service');

    await service.emitPostCommentCreated({
      id: 'comment-1',
      postId: 7,
      postTitle: '测试文章',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '评论内容',
      status: 'pending',
      submittedAt: '2026-04-20T12:00:00.000Z',
    });

    expect(hooks.callHook).toHaveBeenCalledWith('blog:comment:created', {
      id: 'comment-1',
      postId: 7,
      postTitle: '测试文章',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '评论内容',
      status: 'pending',
      submittedAt: '2026-04-20T12:00:00.000Z',
    });
  });

  it('通过自定义调用器映射全部通知事件名称', async () => {
    const { createNotificationEventService } = await import('../../../server/services/notification-event.service');
    const callHook = vi.fn();
    const service = createNotificationEventService({ callHook });

    await service.emitPostCommentReviewed({
      id: 'comment-1',
      postId: 7,
      postTitle: '测试文章',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '评论内容',
      previousStatus: 'pending',
      status: 'approved',
      submittedAt: '2026-04-20T12:00:00.000Z',
      reviewedAt: '2026-04-20T13:00:00.000Z',
    });
    await service.emitGuestbookCreated({
      id: 'guestbook-1',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '留言内容',
      status: 'pending',
      submittedAt: '2026-04-20T12:00:00.000Z',
    });
    await service.emitGuestbookReviewed({
      id: 'guestbook-1',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '留言内容',
      previousStatus: 'pending',
      status: 'approved',
      submittedAt: '2026-04-20T12:00:00.000Z',
      reviewedAt: '2026-04-20T13:00:00.000Z',
    });
    await service.emitDeliveryQueued({
      deliveryId: 'delivery-1',
      eventName: 'blog:comment:created',
      recipients: ['admin@example.com'],
      subject: '[通知] 新评论',
      queuedAt: '2026-04-20T12:00:00.000Z',
    });
    await service.emitDeliverySent({
      deliveryId: 'delivery-1',
      eventName: 'blog:comment:created',
      recipients: ['admin@example.com'],
      subject: '[通知] 新评论',
      queuedAt: '2026-04-20T12:00:00.000Z',
      sentAt: '2026-04-20T12:00:30.000Z',
    });
    await service.emitDeliveryFailed({
      deliveryId: 'delivery-1',
      eventName: 'blog:comment:created',
      recipients: ['admin@example.com'],
      subject: '[通知] 新评论',
      queuedAt: '2026-04-20T12:00:00.000Z',
      failedAt: '2026-04-20T12:00:30.000Z',
      errorMessage: 'SMTP 认证失败',
    });

    expect(callHook.mock.calls).toEqual([
      ['blog:comment:reviewed', expect.objectContaining({ id: 'comment-1' })],
      ['blog:guestbook:created', expect.objectContaining({ id: 'guestbook-1' })],
      ['blog:guestbook:reviewed', expect.objectContaining({ id: 'guestbook-1' })],
      ['notify:delivery:queued', expect.objectContaining({ deliveryId: 'delivery-1' })],
      ['notify:delivery:sent', expect.objectContaining({ sentAt: '2026-04-20T12:00:30.000Z' })],
      ['notify:delivery:failed', expect.objectContaining({ errorMessage: 'SMTP 认证失败' })],
    ]);
  });
});

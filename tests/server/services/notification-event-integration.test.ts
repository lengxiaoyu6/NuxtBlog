import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findPublishedBlogPostRecordById: vi.fn(),
  findPublishedBlogPostRecordBySlug: vi.fn(),
  createPostCommentRecord: vi.fn(),
  findPostCommentRecordById: vi.fn(),
  readAdminPostCommentRecords: vi.fn(),
  readPostCommentRecordsByPostId: vi.fn(),
  updatePostCommentStatusRecord: vi.fn(),
  resolveAuthorRegionByIp: vi.fn(),
  emitPostCommentCreated: vi.fn(),
  emitPostCommentReviewed: vi.fn(),
  readGuestbookPageSettings: vi.fn(),
  readGuestbookEntryRecords: vi.fn(),
  findGuestbookEntryRecordById: vi.fn(),
  createGuestbookEntryRecord: vi.fn(),
  updateGuestbookEntryStatusRecord: vi.fn(),
  emitGuestbookCreated: vi.fn(),
  emitGuestbookReviewed: vi.fn(),
}));

vi.mock('../../../server/repositories/post.repository', () => ({
  findPublishedBlogPostRecordById: mocks.findPublishedBlogPostRecordById,
  findPublishedBlogPostRecordBySlug: mocks.findPublishedBlogPostRecordBySlug,
}));

vi.mock('../../../server/repositories/post-comment.repository', () => ({
  createPostCommentRecord: mocks.createPostCommentRecord,
  findPostCommentRecordById: mocks.findPostCommentRecordById,
  readAdminPostCommentRecords: mocks.readAdminPostCommentRecords,
  readPostCommentRecordsByPostId: mocks.readPostCommentRecordsByPostId,
  updatePostCommentStatusRecord: mocks.updatePostCommentStatusRecord,
}));

vi.mock('../../../server/repositories/guestbook.repository', () => ({
  createGuestbookEntryRecord: mocks.createGuestbookEntryRecord,
  findGuestbookEntryRecordById: mocks.findGuestbookEntryRecordById,
  readGuestbookEntryRecords: mocks.readGuestbookEntryRecords,
  updateGuestbookEntryStatusRecord: mocks.updateGuestbookEntryStatusRecord,
}));

vi.mock('../../../server/services/ip-region.service', () => ({
  UNKNOWN_IP_REGION: '地区未知',
  resolveAuthorRegionByIp: mocks.resolveAuthorRegionByIp,
}));

vi.mock('../../../server/services/page-settings.service', () => ({
  readGuestbookPageSettings: mocks.readGuestbookPageSettings,
}));

vi.mock('../../../server/services/notification-event.service', () => ({
  emitPostCommentCreated: mocks.emitPostCommentCreated,
  emitPostCommentReviewed: mocks.emitPostCommentReviewed,
  emitGuestbookCreated: mocks.emitGuestbookCreated,
  emitGuestbookReviewed: mocks.emitGuestbookReviewed,
}));

describe('notification event integration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.resolveAuthorRegionByIp.mockResolvedValue('广东');
    mocks.readGuestbookPageSettings.mockResolvedValue({ enabled: true });
    mocks.findGuestbookEntryRecordById.mockResolvedValue(null);
  });

  it('默认评论提交服务发布评论待审核事件', async () => {
    const submittedAt = new Date('2026-04-20T12:00:00.000Z');
    mocks.findPublishedBlogPostRecordById.mockResolvedValue({
      id: 7,
      title: '测试文章',
    });
    mocks.createPostCommentRecord.mockResolvedValue({
      id: 'comment-1',
      postId: 7,
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorAvatarUrl: 'https://example.com/avatar.png',
      authorRegion: '广东',
      content: '评论内容',
      status: 'pending',
      submittedAt,
    });

    const service = await import('../../../server/services/post-comment.service');

    await service.createPostComment('7', {
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      content: '评论内容',
    }, {
      clientIp: '113.118.113.77',
    });

    expect(mocks.emitPostCommentCreated).toHaveBeenCalledWith({
      id: 'comment-1',
      postId: 7,
      postTitle: '测试文章',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '评论内容',
      status: 'pending',
      submittedAt: submittedAt.toISOString(),
    });
  });

  it('默认评论审核服务发布评论审核事件', async () => {
    const submittedAt = new Date('2026-04-20T12:00:00.000Z');
    const reviewedAt = new Date('2026-04-20T13:00:00.000Z');
    mocks.findPostCommentRecordById.mockResolvedValue({
      id: 'comment-1',
      postId: 7,
      parentId: 'comment-parent',
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorAvatarUrl: 'https://example.com/avatar.png',
      authorRegion: '广东',
      content: '评论内容',
      status: 'pending',
      submittedAt,
      reviewedAt: null,
    });
    mocks.updatePostCommentStatusRecord.mockResolvedValue({
      id: 'comment-1',
      postId: 7,
      parentId: 'comment-parent',
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorAvatarUrl: 'https://example.com/avatar.png',
      authorRegion: '广东',
      content: '评论内容',
      status: 'approved',
      submittedAt,
      reviewedAt,
      post: {
        id: 7,
        title: '测试文章',
      },
      parent: {
        id: 'comment-parent',
        authorName: '上级访客',
        authorEmail: 'parent@example.com',
      },
    });

    const service = await import('../../../server/services/post-comment.service');

    await service.updatePostCommentStatus('comment-1', 'approved');

    expect(mocks.emitPostCommentReviewed).toHaveBeenCalledWith({
      id: 'comment-1',
      postId: 7,
      postTitle: '测试文章',
      parentId: 'comment-parent',
      parentAuthorEmail: 'parent@example.com',
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '评论内容',
      previousStatus: 'pending',
      status: 'approved',
      submittedAt: submittedAt.toISOString(),
      reviewedAt: reviewedAt.toISOString(),
    });
  });

  it('默认留言提交服务发布留言待审核事件', async () => {
    const submittedAt = new Date('2026-04-20T12:00:00.000Z');
    mocks.createGuestbookEntryRecord.mockResolvedValue({
      id: 'guestbook-1',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorAvatarUrl: 'https://example.com/avatar.png',
      authorRegion: '广东',
      content: '留言内容',
      status: 'pending',
      submittedAt,
      reviewedAt: null,
    });

    const service = await import('../../../server/services/guestbook.service');

    await service.createGuestbookEntry({
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      content: '留言内容',
    }, {
      clientIp: '113.118.113.77',
    });

    expect(mocks.emitGuestbookCreated).toHaveBeenCalledWith({
      id: 'guestbook-1',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '留言内容',
      status: 'pending',
      submittedAt: submittedAt.toISOString(),
    });
  });

  it('默认留言审核服务发布留言审核事件', async () => {
    const submittedAt = new Date('2026-04-20T12:00:00.000Z');
    const reviewedAt = new Date('2026-04-20T13:00:00.000Z');
    mocks.findGuestbookEntryRecordById.mockResolvedValue({
      id: 'guestbook-1',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorAvatarUrl: 'https://example.com/avatar.png',
      authorRegion: '广东',
      content: '留言内容',
      status: 'pending',
      submittedAt,
      reviewedAt: null,
    });
    mocks.updateGuestbookEntryStatusRecord.mockResolvedValue({
      id: 'guestbook-1',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorAvatarUrl: 'https://example.com/avatar.png',
      authorRegion: '广东',
      content: '留言内容',
      status: 'approved',
      submittedAt,
      reviewedAt,
    });

    const service = await import('../../../server/services/guestbook.service');

    await service.updateGuestbookEntryStatus('guestbook-1', 'approved');

    expect(mocks.emitGuestbookReviewed).toHaveBeenCalledWith({
      id: 'guestbook-1',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '留言内容',
      previousStatus: 'pending',
      status: 'approved',
      submittedAt: submittedAt.toISOString(),
      reviewedAt: reviewedAt.toISOString(),
    });
  });
});

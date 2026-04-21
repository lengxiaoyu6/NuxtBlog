import { describe, expect, it, vi } from 'vitest';
import { createAdminPostCommentService } from '../../../server/services/post-comment.service';

describe('createAdminPostCommentService', () => {
  it('审核评论状态后发布评论审核事件', async () => {
    const submittedAt = new Date('2026-04-20T12:00:00.000Z');
    const reviewedAt = new Date('2026-04-20T13:00:00.000Z');
    const emitPostCommentReviewed = vi.fn();
    const service = createAdminPostCommentService({
      readAdminPostCommentRecords: vi.fn(),
      findPostCommentById: vi.fn().mockResolvedValue({
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
      }),
      updatePostCommentStatusRecord: vi.fn().mockResolvedValue({
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
      }),
      createError: (payload: { statusCode: number; statusMessage: string }) => Object.assign(new Error(payload.statusMessage), payload),
      emitPostCommentReviewed,
    });

    await service.updatePostCommentStatus('comment-1', 'approved');

    expect(emitPostCommentReviewed).toHaveBeenCalledWith({
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
});

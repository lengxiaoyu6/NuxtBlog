import { describe, expect, it, vi } from 'vitest';
import { createPostCommentService } from '../../../server/services/post-comment.logic.mjs';

describe('createPostCommentService', () => {
  it('保存评论时写入解析后的地区', async () => {
    const createCommentRecord = vi.fn();
    const resolveAuthorRegionByIp = vi.fn().mockResolvedValue('广东');
    const service = createPostCommentService({
      resolvePublishedPost: vi.fn().mockResolvedValue({ id: 7 }),
      readCommentsByPostId: vi.fn(),
      findCommentById: vi.fn(),
      createCommentRecord,
      resolveAuthorRegionByIp,
      createError: (payload: { statusCode: number; statusMessage: string }) => Object.assign(new Error(payload.statusMessage), payload),
      now: () => new Date('2026-04-20T12:00:00.000Z'),
    });

    await service.createPostComment('7', {
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      content: '评论内容',
    }, {
      clientIp: '113.118.113.77',
    });

    expect(resolveAuthorRegionByIp).toHaveBeenCalledWith('113.118.113.77');
    expect(createCommentRecord).toHaveBeenCalledWith(expect.objectContaining({
      authorRegion: '广东',
    }));
  });

  it('地区解析失败时回退到地区未知', async () => {
    const createCommentRecord = vi.fn();
    const service = createPostCommentService({
      resolvePublishedPost: vi.fn().mockResolvedValue({ id: 7 }),
      readCommentsByPostId: vi.fn(),
      findCommentById: vi.fn(),
      createCommentRecord,
      resolveAuthorRegionByIp: vi.fn().mockRejectedValue(new Error('search failed')),
      createError: (payload: { statusCode: number; statusMessage: string }) => Object.assign(new Error(payload.statusMessage), payload),
      now: () => new Date('2026-04-20T12:00:00.000Z'),
    });

    await service.createPostComment('7', {
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      content: '评论内容',
    }, {
      clientIp: '113.118.113.77',
    });

    expect(createCommentRecord).toHaveBeenCalledWith(expect.objectContaining({
      authorRegion: '地区未知',
    }));
  });

  it('创建评论后发布评论待审核事件', async () => {
    const submittedAt = new Date('2026-04-20T12:00:00.000Z');
    const emitPostCommentCreated = vi.fn();
    const service = createPostCommentService({
      resolvePublishedPost: vi.fn().mockResolvedValue({ id: 7, title: '测试文章' }),
      readCommentsByPostId: vi.fn(),
      findCommentById: vi.fn(),
      createCommentRecord: vi.fn().mockResolvedValue({
        id: 'comment-1',
        postId: 7,
        parentId: null,
        authorName: '测试用户',
        authorEmail: 'author@example.com',
        authorRegion: '广东',
        content: '评论内容',
        status: 'pending',
        submittedAt,
      }),
      resolveAuthorRegionByIp: vi.fn().mockResolvedValue('广东'),
      emitPostCommentCreated,
      createError: (payload: { statusCode: number; statusMessage: string }) => Object.assign(new Error(payload.statusMessage), payload),
      now: () => submittedAt,
    });

    await service.createPostComment('7', {
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      content: '评论内容',
    }, {
      clientIp: '113.118.113.77',
    });

    expect(emitPostCommentCreated).toHaveBeenCalledWith({
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
});

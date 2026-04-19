import { beforeEach, describe, expect, it, vi } from 'vitest';

const createPostComment = vi.fn();
const consumeRateLimit = vi.fn();
const verifyTurnstile = vi.fn();
const readBodyMock = vi.fn();
const getRouterParamMock = vi.fn();

vi.mock('../../../server/services/post-comment.service', () => ({
  createPostComment,
  readAdminPostComments: vi.fn(),
  readPublicPostComments: vi.fn(),
  updatePostCommentStatus: vi.fn(),
}));

vi.mock('../../../server/services/security-request.service', () => ({
  useSecurityRequestService: () => ({
    consumeRateLimit,
    verifyTurnstile,
  }),
}));

vi.mock('../../../server/services/security-settings.service', () => ({
  toSecurityRateLimitPolicy: vi.fn().mockImplementation((value) => value),
}));

vi.mock('../../../server/services/site-settings.service', () => ({
  readSiteSecuritySettings: vi.fn().mockResolvedValue({
    comments: {
      rateLimit: { windowMs: 60000, limits: { ip: 3, session: 5 } },
      captchaEnabled: true,
    },
  }),
}));

vi.mock('../../../server/utils/require-admin-session', () => ({
  requireAdminSession: vi.fn(),
}));

vi.stubGlobal('readBody', readBodyMock);
vi.stubGlobal('getRouterParam', getRouterParamMock);

const { postCommentController } = await import('../../../server/controllers/post-comment.controller');

describe('postCommentController.createPublicPostComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRouterParamMock.mockReturnValue('hello-world');
    readBodyMock.mockResolvedValue({
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      content: '评论内容',
      turnstileToken: 'token-1',
    });
    consumeRateLimit.mockResolvedValue({ ip: '113.118.113.77' });
    verifyTurnstile.mockResolvedValue(undefined);
    createPostComment.mockResolvedValue({ ok: true, message: '评论已提交，等待审核后展示' });
  });

  it('将请求上下文中的客户端 IP 传给评论服务', async () => {
    await postCommentController.createPublicPostComment({} as never);

    expect(createPostComment).toHaveBeenCalledWith('hello-world', expect.objectContaining({
      content: '评论内容',
    }), {
      clientIp: '113.118.113.77',
    });
  });
});

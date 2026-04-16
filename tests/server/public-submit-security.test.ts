import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createPostComment: vi.fn(),
  createGuestbookEntry: vi.fn(),
  createFriendLinkApplication: vi.fn(),
  increasePublicPostLikes: vi.fn(),
  readSiteSecuritySettings: vi.fn(),
  securityRequestService: {
    consumeRateLimit: vi.fn(),
    verifyTurnstile: vi.fn(),
  },
}));

vi.mock('../../server/services/post-comment.service', () => ({
  createPostComment: mocks.createPostComment,
  readAdminPostComments: vi.fn(),
  readPublicPostComments: vi.fn(),
  updatePostCommentStatus: vi.fn(),
}));

vi.mock('../../server/services/guestbook.service', () => ({
  createGuestbookEntry: mocks.createGuestbookEntry,
  readAdminGuestbookComments: vi.fn(),
  readPublicGuestbookEntries: vi.fn(),
  updateGuestbookEntryStatus: vi.fn(),
}));

vi.mock('../../server/services/friend-link.service', () => ({
  createFriendLinkApplication: mocks.createFriendLinkApplication,
  createAdminFriendLink: vi.fn(),
  deleteAdminFriendLink: vi.fn(),
  readAdminFriendLinks: vi.fn(),
  updateAdminFriendLink: vi.fn(),
}));

vi.mock('../../server/services/post.service', () => ({
  bulkPublishAdminPosts: vi.fn(),
  createAdminPost: vi.fn(),
  deleteAdminPost: vi.fn(),
  increasePublicPostLikes: mocks.increasePublicPostLikes,
  increasePublicPostViews: vi.fn(),
  readAdminDashboardSummary: vi.fn(),
  readAdminPostDetail: vi.fn(),
  readAdminPosts: vi.fn(),
  readPublicPostArchive: vi.fn(),
  readPublicPostDetail: vi.fn(),
  readPublicPosts: vi.fn(),
  updateAdminPost: vi.fn(),
}));

vi.mock('../../server/services/site-settings.service', () => ({
  readSiteSecuritySettings: mocks.readSiteSecuritySettings,
}));

vi.mock('../../server/services/security-request.service', () => ({
  useSecurityRequestService: () => mocks.securityRequestService,
}));

function createSiteSecuritySettings() {
  return {
    turnstileSiteKey: 'site-key',
    login: {
      captchaEnabled: false,
      rateLimit: {
        windowSeconds: 120,
        maxPerIp: 8,
        maxPerSession: 4,
      },
      maxFailures: 5,
      cooldownSeconds: 900,
    },
    comments: {
      captchaEnabled: true,
      rateLimit: {
        windowSeconds: 300,
        maxPerIp: 6,
        maxPerSession: 3,
      },
    },
    guestbook: {
      captchaEnabled: true,
      rateLimit: {
        windowSeconds: 300,
        maxPerIp: 4,
        maxPerSession: 2,
      },
    },
    linkApplications: {
      captchaEnabled: true,
      rateLimit: {
        windowSeconds: 1800,
        maxPerIp: 3,
        maxPerSession: 1,
      },
    },
    likes: {
      rateLimit: {
        windowSeconds: 300,
        maxPerIp: 30,
        maxPerSession: 10,
      },
    },
  };
}

describe('public submit security integration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('readBody', vi.fn());
    vi.stubGlobal('getRouterParam', vi.fn().mockReturnValue('article-identifier'));
    mocks.readSiteSecuritySettings.mockResolvedValue(createSiteSecuritySettings());
    mocks.securityRequestService.consumeRateLimit.mockResolvedValue({});
    mocks.securityRequestService.verifyTurnstile.mockResolvedValue({ ok: true });
    mocks.createPostComment.mockResolvedValue({ ok: true, message: '评论已提交' });
    mocks.createGuestbookEntry.mockResolvedValue({ ok: true, message: '留言已提交' });
    mocks.createFriendLinkApplication.mockResolvedValue({ ok: true, message: '友链申请已提交' });
    mocks.increasePublicPostLikes.mockResolvedValue({ likesCount: 2, viewsCount: 5 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('checks rate limit and captcha before creating a public comment', async () => {
    vi.mocked(globalThis.readBody).mockResolvedValue({
      authorName: '访客',
      authorEmail: 'guest@example.com',
      content: '测试评论',
      turnstileToken: 'comment-token',
    });

    const { postCommentController } = await import('../../server/controllers/post-comment.controller');
    await postCommentController.createPublicPostComment({} as never);

    expect(mocks.securityRequestService.consumeRateLimit).toHaveBeenCalledWith({}, {
      action: 'post_comment_submit',
      policy: {
        windowMs: 300_000,
        limits: {
          ip: 6,
          session: 3,
        },
      },
      blockedMessage: '评论提交过于频繁，请稍后再试',
    });
    expect(mocks.securityRequestService.verifyTurnstile).toHaveBeenCalledWith({}, {
      enabled: true,
      token: 'comment-token',
    });
    expect(mocks.createPostComment).toHaveBeenCalledWith('article-identifier', expect.objectContaining({
      content: '测试评论',
    }));
  });

  it('checks rate limit and captcha before creating a guestbook entry', async () => {
    vi.mocked(globalThis.readBody).mockResolvedValue({
      authorName: '访客',
      authorEmail: 'guest@example.com',
      content: '测试留言',
      turnstileToken: 'guestbook-token',
    });

    const { guestbookController } = await import('../../server/controllers/guestbook.controller');
    await guestbookController.createPublicGuestbookEntry({} as never);

    expect(mocks.securityRequestService.consumeRateLimit).toHaveBeenCalledWith({}, {
      action: 'guestbook_submit',
      policy: {
        windowMs: 300_000,
        limits: {
          ip: 4,
          session: 2,
        },
      },
      blockedMessage: '留言提交过于频繁，请稍后再试',
    });
    expect(mocks.securityRequestService.verifyTurnstile).toHaveBeenCalledWith({}, {
      enabled: true,
      token: 'guestbook-token',
    });
    expect(mocks.createGuestbookEntry).toHaveBeenCalledWith(expect.objectContaining({
      content: '测试留言',
    }));
  });

  it('checks rate limit and captcha before creating a friend-link application', async () => {
    vi.mocked(globalThis.readBody).mockResolvedValue({
      name: '示例站点',
      url: 'https://example.com',
      avatarUrl: 'https://example.com/avatar.png',
      contact: 'guest@example.com',
      description: '测试友链',
      turnstileToken: 'link-token',
    });

    const { friendLinkController } = await import('../../server/controllers/friend-link.controller');
    await friendLinkController.createPublicFriendLinkApplication({} as never);

    expect(mocks.securityRequestService.consumeRateLimit).toHaveBeenCalledWith({}, {
      action: 'friend_link_application_submit',
      policy: {
        windowMs: 1_800_000,
        limits: {
          ip: 3,
          session: 1,
        },
      },
      blockedMessage: '友链申请提交过于频繁，请稍后再试',
    });
    expect(mocks.securityRequestService.verifyTurnstile).toHaveBeenCalledWith({}, {
      enabled: true,
      token: 'link-token',
    });
    expect(mocks.createFriendLinkApplication).toHaveBeenCalledWith(expect.objectContaining({
      name: '示例站点',
    }));
  });

  it('checks rate limit before increasing a public post like', async () => {
    const { postController } = await import('../../server/controllers/post.controller');
    await postController.increasePublicPostLikes({} as never);

    expect(mocks.securityRequestService.consumeRateLimit).toHaveBeenCalledWith({}, {
      action: 'post_like',
      policy: {
        windowMs: 300_000,
        limits: {
          ip: 30,
          session: 10,
        },
      },
      blockedMessage: '点赞操作过于频繁，请稍后再试',
    });
    expect(mocks.securityRequestService.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.increasePublicPostLikes).toHaveBeenCalledWith('article-identifier');
  });
});

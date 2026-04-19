import { beforeEach, describe, expect, it, vi } from 'vitest';

const createGuestbookEntry = vi.fn();
const consumeRateLimit = vi.fn();
const verifyTurnstile = vi.fn();
const readBodyMock = vi.fn();

vi.mock('../../../server/services/guestbook.service', () => ({
  createGuestbookEntry,
  readAdminGuestbookComments: vi.fn(),
  readPublicGuestbookEntries: vi.fn(),
  updateGuestbookEntryStatus: vi.fn(),
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
    guestbook: {
      rateLimit: { windowMs: 60000, limits: { ip: 3, session: 5 } },
      captchaEnabled: true,
    },
  }),
}));

vi.mock('../../../server/utils/require-admin-session', () => ({
  requireAdminSession: vi.fn(),
}));

vi.stubGlobal('readBody', readBodyMock);

const { guestbookController } = await import('../../../server/controllers/guestbook.controller');

describe('guestbookController.createPublicGuestbookEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readBodyMock.mockResolvedValue({
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      content: '留言内容',
      turnstileToken: 'token-1',
    });
    consumeRateLimit.mockResolvedValue({ ip: '113.118.113.77' });
    verifyTurnstile.mockResolvedValue(undefined);
    createGuestbookEntry.mockResolvedValue({ ok: true, message: '留言已提交，等待审核后展示' });
  });

  it('将请求上下文中的客户端 IP 传给留言服务', async () => {
    await guestbookController.createPublicGuestbookEntry({} as never);

    expect(createGuestbookEntry).toHaveBeenCalledWith(expect.objectContaining({
      content: '留言内容',
    }), {
      clientIp: '113.118.113.77',
    });
  });
});

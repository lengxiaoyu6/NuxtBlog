import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  sendNotificationTestEmail: vi.fn(),
  readBody: vi.fn(),
  getRouterParam: vi.fn(),
}));

vi.mock('../../server/utils/require-admin-session', () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

vi.mock('../../server/services/notification-delivery.service', () => ({
  sendNotificationTestEmail: mocks.sendNotificationTestEmail,
}));

describe('admin module notification test api', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
    vi.stubGlobal('readBody', mocks.readBody);
    vi.stubGlobal('getRouterParam', mocks.getRouterParam);
    mocks.requireAdminSession.mockResolvedValue({ id: 'admin-user' });
    mocks.sendNotificationTestEmail.mockResolvedValue(undefined);
    mocks.readBody.mockResolvedValue({ recipient: 'admin@example.com' });
    mocks.getRouterParam.mockReturnValue('notification-center');
  });

  it('requires an admin session and sends a test email to the selected recipient', async () => {
    const handlerModule = await import('../../server/api/admin/modules/[moduleKey]/test.post');
    const result = await handlerModule.default({} as never);

    expect(mocks.requireAdminSession).toHaveBeenCalledTimes(1);
    expect(mocks.getRouterParam).toHaveBeenCalledWith({}, 'moduleKey');
    expect(mocks.sendNotificationTestEmail).toHaveBeenCalledWith('admin@example.com');
    expect(result).toEqual({
      ok: true,
      message: '测试邮件已发送至 admin@example.com',
    });
  });
});

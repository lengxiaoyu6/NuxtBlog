import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  readAdminModules: vi.fn(),
  readAdminModule: vi.fn(),
  installModule: vi.fn(),
  uninstallModule: vi.fn(),
  enableModule: vi.fn(),
  disableModule: vi.fn(),
  readNotificationModuleSettings: vi.fn(),
  saveNotificationModuleSettings: vi.fn(),
  readBody: vi.fn(),
  getRouterParam: vi.fn(),
}));

vi.mock('../../server/utils/require-admin-session', () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

vi.mock('../../server/services/module-center.service', () => ({
  readAdminModules: mocks.readAdminModules,
  readAdminModule: mocks.readAdminModule,
  installModule: mocks.installModule,
  uninstallModule: mocks.uninstallModule,
  enableModule: mocks.enableModule,
  disableModule: mocks.disableModule,
}));

vi.mock('../../server/services/notification-module.service', () => ({
  readNotificationModuleSettings: mocks.readNotificationModuleSettings,
  saveNotificationModuleSettings: mocks.saveNotificationModuleSettings,
}));

describe('admin modules api', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
    vi.stubGlobal('readBody', mocks.readBody);
    vi.stubGlobal('getRouterParam', mocks.getRouterParam);
    mocks.requireAdminSession.mockResolvedValue({ id: 'admin-user' });
    mocks.getRouterParam.mockReturnValue('notification-center');
    mocks.readAdminModules.mockResolvedValue([
      {
        key: 'notification-center',
        name: '邮件通知',
        description: '评论与留言邮件通知',
        version: '1.0.0',
        settingsPath: '/admin/modules/notification-center',
        installed: true,
        enabled: true,
        installedAt: '2026-04-21T00:00:00.000Z',
        updatedAt: '2026-04-21T00:00:00.000Z',
      },
    ]);
    mocks.readAdminModule.mockResolvedValue({
      key: 'notification-center',
      name: '邮件通知',
      description: '评论与留言邮件通知',
      version: '1.0.0',
      settingsPath: '/admin/modules/notification-center',
      installed: true,
      enabled: true,
      installedAt: '2026-04-21T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
    });
    mocks.installModule.mockImplementation(async () => mocks.readAdminModule.mock.results[0]?.value ?? null);
    mocks.uninstallModule.mockImplementation(async () => ({
      ...(await mocks.readAdminModule()),
      enabled: false,
      installed: false,
    }));
    mocks.enableModule.mockImplementation(async () => await mocks.readAdminModule());
    mocks.disableModule.mockImplementation(async () => ({
      ...(await mocks.readAdminModule()),
      enabled: false,
    }));
    mocks.readNotificationModuleSettings.mockResolvedValue({
      enabled: true,
      subjectPrefix: '[Blog 通知]',
      adminRecipients: ['admin@example.com'],
      smtp: {
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        username: 'notify@example.com',
        password: '',
        passwordConfigured: true,
        fromName: 'Blog Notice',
        fromEmail: 'notify@example.com',
        replyToEmail: 'reply@example.com',
      },
      events: {
        postCommentCreated: true,
        postCommentReply: true,
        guestbookCreated: true,
      },
    });
    mocks.saveNotificationModuleSettings.mockImplementation(async (input) => input);
    mocks.readBody.mockResolvedValue({
      enabled: true,
      subjectPrefix: '[Blog 通知]',
      adminRecipients: ['admin@example.com'],
      smtp: {
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        username: 'notify@example.com',
        password: '',
        passwordConfigured: true,
        fromName: 'Blog Notice',
        fromEmail: 'notify@example.com',
        replyToEmail: 'reply@example.com',
      },
      events: {
        postCommentCreated: true,
        postCommentReply: true,
        guestbookCreated: true,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns module list after admin auth', async () => {
    const handlerModule = await import('../../server/api/admin/modules/index.get');
    const result = await handlerModule.default({} as never);

    expect(mocks.requireAdminSession).toHaveBeenCalledTimes(1);
    expect(mocks.readAdminModules).toHaveBeenCalledTimes(1);
    expect(result).toEqual(await mocks.readAdminModules.mock.results[0]?.value);
  });

  it('returns module detail based on the route parameter', async () => {
    const handlerModule = await import('../../server/api/admin/modules/[moduleKey].get');
    const result = await handlerModule.default({} as never);

    expect(mocks.requireAdminSession).toHaveBeenCalledTimes(1);
    expect(mocks.getRouterParam).toHaveBeenCalledWith({}, 'moduleKey');
    expect(mocks.readAdminModule).toHaveBeenCalledWith('notification-center');
    expect(result).toEqual(await mocks.readAdminModule.mock.results[0]?.value);
  });

  it('supports installing enabling disabling and uninstalling a module', async () => {
    const installHandlerModule = await import('../../server/api/admin/modules/[moduleKey]/install.post');
    const enableHandlerModule = await import('../../server/api/admin/modules/[moduleKey]/enable.post');
    const disableHandlerModule = await import('../../server/api/admin/modules/[moduleKey]/disable.post');
    const uninstallHandlerModule = await import('../../server/api/admin/modules/[moduleKey]/uninstall.post');

    await installHandlerModule.default({} as never);
    await enableHandlerModule.default({} as never);
    await disableHandlerModule.default({} as never);
    await uninstallHandlerModule.default({} as never);

    expect(mocks.installModule).toHaveBeenCalledWith('notification-center');
    expect(mocks.enableModule).toHaveBeenCalledWith('notification-center');
    expect(mocks.disableModule).toHaveBeenCalledWith('notification-center');
    expect(mocks.uninstallModule).toHaveBeenCalledWith('notification-center');
  });

  it('reads notification module settings after admin auth', async () => {
    const handlerModule = await import('../../server/api/admin/modules/[moduleKey]/settings.get');
    const result = await handlerModule.default({} as never);

    expect(mocks.requireAdminSession).toHaveBeenCalledTimes(1);
    expect(mocks.getRouterParam).toHaveBeenCalledWith({}, 'moduleKey');
    expect(mocks.readNotificationModuleSettings).toHaveBeenCalledTimes(1);
    expect(result).toEqual(await mocks.readNotificationModuleSettings.mock.results[0]?.value);
  });

  it('saves notification module settings after admin auth', async () => {
    const handlerModule = await import('../../server/api/admin/modules/[moduleKey]/settings.put');
    const result = await handlerModule.default({} as never);

    expect(mocks.requireAdminSession).toHaveBeenCalledTimes(1);
    expect(mocks.getRouterParam).toHaveBeenCalledWith({}, 'moduleKey');
    expect(mocks.readBody).toHaveBeenCalledTimes(1);
    expect(mocks.saveNotificationModuleSettings).toHaveBeenCalledWith(await mocks.readBody.mock.results[0]?.value);
    expect(result).toEqual(await mocks.saveNotificationModuleSettings.mock.results[0]?.value);
  });
});

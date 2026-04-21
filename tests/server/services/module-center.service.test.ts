import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('module center service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('reads registered modules and applies persisted install state', async () => {
    const { createModuleCenterService } = await import('../../../server/services/module-center.service');
    const writeModuleStateStore = vi.fn();
    const service = createModuleCenterService({
      registry: [
        {
          key: 'notification-center',
          name: '邮件通知',
          description: '评论与留言邮件通知',
          version: '1.0.0',
          defaultInstalled: false,
          defaultEnabled: false,
          settingsPath: '/admin/modules/notification-center',
        },
      ],
      readModuleStateStore: vi.fn().mockResolvedValue({
        'notification-center': {
          installed: true,
          enabled: false,
          installedAt: '2026-04-21T10:00:00.000Z',
          updatedAt: '2026-04-21T10:00:00.000Z',
        },
      }),
      writeModuleStateStore,
      now: () => new Date('2026-04-21T12:00:00.000Z'),
    });

    const modules = await service.readAdminModules();

    expect(modules).toEqual([
      expect.objectContaining({
        key: 'notification-center',
        installed: true,
        enabled: false,
        settingsPath: '/admin/modules/notification-center',
      }),
    ]);
  });

  it('uses 邮件通知 as the default registry display name', async () => {
    const { createModuleCenterService } = await import('../../../server/services/module-center.service');
    const service = createModuleCenterService({
      readModuleStateStore: vi.fn().mockResolvedValue({}),
      writeModuleStateStore: vi.fn(),
    });

    const moduleItem = await service.readAdminModule('notification-center');

    expect(moduleItem.name).toBe('邮件通知');
  });

  it('supports install, disable, enable, and uninstall transitions', async () => {
    const store = {} as Record<string, unknown>;
    const writeModuleStateStore = vi.fn().mockImplementation(async (nextStore) => {
      Object.assign(store, nextStore);
    });
    const { createModuleCenterService } = await import('../../../server/services/module-center.service');
    const service = createModuleCenterService({
      registry: [
        {
          key: 'notification-center',
          name: '邮件通知',
          description: '评论与留言邮件通知',
          version: '1.0.0',
          defaultInstalled: false,
          defaultEnabled: false,
          settingsPath: '/admin/modules/notification-center',
        },
      ],
      readModuleStateStore: vi.fn().mockResolvedValue(store),
      writeModuleStateStore,
      now: () => new Date('2026-04-21T12:00:00.000Z'),
    });

    await service.installModule('notification-center');
    await service.disableModule('notification-center');
    await service.enableModule('notification-center');
    await service.uninstallModule('notification-center');

    expect(writeModuleStateStore).toHaveBeenCalledTimes(4);
    expect(store).toEqual({
      'notification-center': {
        installed: false,
        enabled: false,
        installedAt: '2026-04-21T12:00:00.000Z',
        updatedAt: '2026-04-21T12:00:00.000Z',
      },
    });
  });
});

import type {
  AdminModuleRegistryItem,
  AdminModuleStateStore,
  AdminModuleSummary,
} from '../../shared/types/module-center';
import {
  readModuleStateStore,
  writeModuleStateStore,
} from '../repositories/module-center.repository';

const DEFAULT_ADMIN_MODULES = [
  {
    key: 'notification-center',
    name: '邮件通知',
    description: '评论与留言邮件通知',
    version: '1.0.0',
    settingsPath: '/admin/modules/notification-center',
    defaultInstalled: true,
    defaultEnabled: true,
  },
] satisfies AdminModuleRegistryItem[];

interface ModuleCenterServiceDependencies {
  registry?: AdminModuleRegistryItem[];
  readModuleStateStore?: () => Promise<AdminModuleStateStore>;
  writeModuleStateStore?: (store: AdminModuleStateStore) => Promise<void> | void;
  now?: () => Date;
}

function createRequestError(statusCode: number, statusMessage: string) {
  if (typeof globalThis.createError === 'function') {
    return globalThis.createError({ statusCode, statusMessage });
  }

  return Object.assign(new Error(statusMessage), {
    statusCode,
    statusMessage,
  });
}

function toModuleSummary(
  registryItem: AdminModuleRegistryItem,
  stateStore: AdminModuleStateStore,
): AdminModuleSummary {
  const persistedState = stateStore[registryItem.key];
  const installed = persistedState?.installed ?? Boolean(registryItem.defaultInstalled);
  const enabled = installed && (persistedState?.enabled ?? Boolean(registryItem.defaultEnabled ?? registryItem.defaultInstalled));

  return {
    ...registryItem,
    settingsPath: registryItem.settingsPath ?? null,
    installed,
    enabled,
    installedAt: persistedState?.installedAt ?? null,
    updatedAt: persistedState?.updatedAt ?? null,
  } satisfies AdminModuleSummary;
}

export function createModuleCenterService(dependencies: ModuleCenterServiceDependencies = {}) {
  const {
    registry = DEFAULT_ADMIN_MODULES,
    readModuleStateStore: readModuleStateStoreImpl = readModuleStateStore,
    writeModuleStateStore: writeModuleStateStoreImpl = writeModuleStateStore,
    now = () => new Date(),
  } = dependencies;

  async function readRegistryState() {
    const stateStore = await readModuleStateStoreImpl();

    return {
      stateStore,
      modules: registry.map((item) => toModuleSummary(item, stateStore)),
    };
  }

  function ensureRegistryItem(moduleKey: string) {
    const registryItem = registry.find((item) => item.key === moduleKey);

    if (!registryItem) {
      throw createRequestError(404, '模块不存在');
    }

    return registryItem;
  }

  async function persistModuleState(moduleKey: string, updater: (current: AdminModuleSummary) => AdminModuleStateStore[string]) {
    const registryItem = ensureRegistryItem(moduleKey);
    const { stateStore } = await readRegistryState();
    const current = toModuleSummary(registryItem, stateStore);
    const nextEntry = updater(current);
    const nextStore = {
      ...stateStore,
      [moduleKey]: nextEntry,
    } satisfies AdminModuleStateStore;

    await writeModuleStateStoreImpl(nextStore);
    return toModuleSummary(registryItem, nextStore);
  }

  return {
    async readAdminModules() {
      const { modules } = await readRegistryState();
      return modules;
    },
    async readAdminModule(moduleKey: string) {
      const registryItem = ensureRegistryItem(moduleKey);
      const stateStore = await readModuleStateStoreImpl();
      return toModuleSummary(registryItem, stateStore);
    },
    async installModule(moduleKey: string) {
      return await persistModuleState(moduleKey, (current) => {
        const timestamp = now().toISOString();

        return {
          installed: true,
          enabled: true,
          installedAt: current.installedAt ?? timestamp,
          updatedAt: timestamp,
        };
      });
    },
    async uninstallModule(moduleKey: string) {
      return await persistModuleState(moduleKey, (current) => ({
        installed: false,
        enabled: false,
        installedAt: current.installedAt,
        updatedAt: now().toISOString(),
      }));
    },
    async enableModule(moduleKey: string) {
      return await persistModuleState(moduleKey, (current) => {
        const timestamp = now().toISOString();

        return {
          installed: true,
          enabled: true,
          installedAt: current.installedAt ?? timestamp,
          updatedAt: timestamp,
        };
      });
    },
    async disableModule(moduleKey: string) {
      return await persistModuleState(moduleKey, (current) => ({
        installed: current.installed || Boolean(current.defaultInstalled),
        enabled: false,
        installedAt: current.installedAt,
        updatedAt: now().toISOString(),
      }));
    },
    async isModuleEnabled(moduleKey: string) {
      const module = await this.readAdminModule(moduleKey);
      return module.installed && module.enabled;
    },
  };
}

const moduleCenterService = createModuleCenterService();

export const readAdminModules = moduleCenterService.readAdminModules.bind(moduleCenterService);
export const readAdminModule = moduleCenterService.readAdminModule.bind(moduleCenterService);
export const installModule = moduleCenterService.installModule.bind(moduleCenterService);
export const uninstallModule = moduleCenterService.uninstallModule.bind(moduleCenterService);
export const enableModule = moduleCenterService.enableModule.bind(moduleCenterService);
export const disableModule = moduleCenterService.disableModule.bind(moduleCenterService);
export const isModuleEnabled = moduleCenterService.isModuleEnabled.bind(moduleCenterService);
export const isNotificationModuleEnabled = () => moduleCenterService.isModuleEnabled('notification-center');

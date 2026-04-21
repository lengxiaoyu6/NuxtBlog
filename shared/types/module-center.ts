export interface AdminModuleRegistryItem {
  key: string;
  name: string;
  description: string;
  version: string;
  settingsPath?: string | null;
  defaultInstalled?: boolean;
  defaultEnabled?: boolean;
}

export interface PersistedAdminModuleState {
  installed: boolean;
  enabled: boolean;
  installedAt: string | null;
  updatedAt: string | null;
}

export type AdminModuleStateStore = Record<string, PersistedAdminModuleState>;

export interface AdminModuleSummary extends AdminModuleRegistryItem {
  installed: boolean;
  enabled: boolean;
  installedAt: string | null;
  updatedAt: string | null;
}

import { computed } from 'vue';
import { clonePageSettings, DEFAULT_PAGE_SETTINGS, MANAGED_PAGE_META } from '~/constants/page-settings';
import type { ManagedPageKey, ManagedPageSettings } from '~/types/page-settings';

interface FetchPageSettingsOptions {
  admin?: boolean;
  force?: boolean;
}

export function usePageSettings() {
  const pageSettings = useState('page-settings', () => clonePageSettings(DEFAULT_PAGE_SETTINGS));
  const ready = useState('page-settings-ready', () => false);
  const scope = useState<'public' | 'admin' | null>('page-settings-scope', () => null);

  const enabledPages = computed(() =>
    MANAGED_PAGE_META.filter((item) => pageSettings.value[item.key].enabled)
  );

  const managedPageEnabledMap = computed<Record<string, boolean>>(() =>
    MANAGED_PAGE_META.reduce((result, item) => {
      result[item.path] = pageSettings.value[item.key].enabled;
      return result;
    }, {} as Record<string, boolean>)
  );

  function getManagedPageSettings<T extends ManagedPageKey>(key: T) {
    return pageSettings.value[key];
  }

  async function fetchPageSettings(options: FetchPageSettingsOptions = {}) {
    const nextScope = options.admin ? 'admin' : 'public';
    const endpoint = options.admin ? '/api/admin/page-settings' : '/api/page-settings';

    if (!options.force && ready.value && scope.value === nextScope) {
      return pageSettings.value;
    }

    try {
      const response = await $fetch<ManagedPageSettings>(endpoint);
      const nextSettings = clonePageSettings(response);
      pageSettings.value = nextSettings;
      ready.value = true;
      scope.value = nextScope;
      return nextSettings;
    }
    catch {
      if (!ready.value || scope.value !== nextScope) {
        pageSettings.value = clonePageSettings(DEFAULT_PAGE_SETTINGS);
        ready.value = true;
        scope.value = nextScope;
      }

      return pageSettings.value;
    }
  }

  return {
    pageSettings: pageSettings,
    ready: ready,
    fetch: fetchPageSettings,
    fetchPageSettings: fetchPageSettings,
    enabledPages: enabledPages,
    managedPageEnabledMap: managedPageEnabledMap,
    getManagedPageSettings: getManagedPageSettings,
  };
}

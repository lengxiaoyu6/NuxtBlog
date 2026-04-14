import { cloneSiteSettings, DEFAULT_SITE_SETTINGS } from '~/constants/site-settings';
import type { AdminSettingsForm } from '~/types/admin-settings';

interface FetchSiteSettingsOptions {
  admin?: boolean;
  force?: boolean;
}

export function useSiteSettings() {
  const settings = useState('site-settings', () => cloneSiteSettings(DEFAULT_SITE_SETTINGS));
  const ready = useState('site-settings-ready', () => false);
  const scope = useState<'public' | 'admin' | null>('site-settings-scope', () => null);

  async function fetchSiteSettings(options: FetchSiteSettingsOptions = {}) {
    const nextScope = options.admin ? 'admin' : 'public';
    const endpoint = options.admin ? '/api/admin/site-settings' : '/api/site-settings';

    if (!options.force && ready.value && scope.value === nextScope) {
      return settings.value;
    }

    try {
      const response = await $fetch<AdminSettingsForm>(endpoint);
      const nextSettings = cloneSiteSettings(response);
      settings.value = nextSettings;
      ready.value = true;
      scope.value = nextScope;
      return nextSettings;
    }
    catch {
      if (!ready.value || scope.value !== nextScope) {
        settings.value = cloneSiteSettings(DEFAULT_SITE_SETTINGS);
        ready.value = true;
        scope.value = nextScope;
      }

      return settings.value;
    }
  }

  return {
    settings: settings,
    ready: ready,
    fetch: fetchSiteSettings,
    fetchSiteSettings: fetchSiteSettings,
  };
}

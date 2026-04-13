import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { DEFAULT_SITE_SETTINGS } from '~/constants/site-settings';

function resolveSiteName(siteName: string) {
  const normalizedSiteName = siteName.trim();
  return normalizedSiteName || DEFAULT_SITE_SETTINGS.site.name;
}

function composePageTitle(titleSegment: string, siteName: string) {
  const normalizedTitleSegment = titleSegment.trim();

  if (!normalizedTitleSegment) {
    return siteName;
  }

  return `${normalizedTitleSegment} - ${siteName}`;
}

export function useSitePageTitle(titleSegment: MaybeRefOrGetter<string | null | undefined> = '') {
  const { settings } = useSiteSettings();

  const title = computed(() => {
    return composePageTitle(
      toValue(titleSegment) ?? '',
      resolveSiteName(settings.value.site.name),
    );
  });

  useHead({
    title,
  });

  return {
    title,
  };
}

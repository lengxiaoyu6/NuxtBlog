const EMPTY_REGION_VALUES = new Set(['', '0']);
const CHINA_NAMES = new Set(['中国', '中华人民共和国', 'China']);

function normalizeSegment(value: string | undefined) {
  const normalizedValue = value?.trim() || '';
  return EMPTY_REGION_VALUES.has(normalizedValue) ? '' : normalizedValue;
}

function normalizeChineseRegionName(value: string) {
  return value
    .replace(/特别行政区$/u, '')
    .replace(/壮族自治区$/u, '')
    .replace(/回族自治区$/u, '')
    .replace(/维吾尔自治区$/u, '')
    .replace(/自治区$/u, '')
    .replace(/省$/u, '')
    .replace(/市$/u, '')
    .trim();
}

export function normalizeRegionName(rawRegion: string) {
  const segments = rawRegion.split('|').map(normalizeSegment);
  const country = segments[0] || '';
  const region = segments[1] || '';
  const countryCode = segments[4] || '';

  if (!country && !region) {
    return '';
  }

  const isChinaRegion = CHINA_NAMES.has(country) || countryCode.toUpperCase() === 'CN';
  if (isChinaRegion) {
    const normalizedRegion = normalizeChineseRegionName(region);
    return normalizedRegion || normalizeChineseRegionName(country);
  }

  return country || region;
}

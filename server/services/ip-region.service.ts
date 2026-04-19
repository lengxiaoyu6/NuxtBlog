import { isIP } from 'node:net';
import { isAbsolute, resolve } from 'node:path';
import { IPv4, IPv6, loadContentFromFile, newWithBuffer, verifyFromFile } from 'ip2region.js';
import { normalizeRegionName } from '../utils/region-normalizer';

export const PRIVATE_IP_REGION = '内网地址';
export const UNKNOWN_IP_REGION = '地区未知';

interface LoggerLike {
  warn?: (message: string, payload?: Record<string, unknown>) => void;
}

interface IpRegionServiceOptions {
  searchIpv4?: (ip: string) => string | Promise<string>;
  searchIpv6?: (ip: string) => string | Promise<string>;
  logger?: LoggerLike;
}

interface RuntimeIpRegionService {
  resolveAuthorRegionByIp(ip: string | null | undefined): Promise<string>;
}

let ipRegionServiceInstance: RuntimeIpRegionService | null = null;

function normalizeIpAddress(ip: string | null | undefined) {
  const rawValue = typeof ip === 'string' ? ip.trim() : '';
  if (!rawValue) {
    return '';
  }

  const normalizedBracketIp = rawValue.replace(/^\[(.*)\]$/u, '$1');
  const normalizedZoneIp = normalizedBracketIp.split('%')[0] || '';

  if (normalizedZoneIp.startsWith('::ffff:')) {
    return normalizedZoneIp.slice(7);
  }

  return normalizedZoneIp;
}

function isPrivateIpv4(ip: string) {
  const segments = ip.split('.').map((segment) => Number(segment));
  if (segments.length !== 4 || segments.some((segment) => Number.isNaN(segment) || segment < 0 || segment > 255)) {
    return false;
  }

  const [first, second] = segments;
  return first === 0
    || first === 10
    || first === 127
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || (first === 100 && second >= 64 && second <= 127);
}

function isPrivateIpv6(ip: string) {
  const normalizedValue = ip.toLowerCase();
  if (normalizedValue === '::1' || normalizedValue === '::') {
    return true;
  }

  if (normalizedValue.startsWith('fc') || normalizedValue.startsWith('fd')) {
    return true;
  }

  const firstBlock = normalizedValue.split(':')[0] || '';
  if (!firstBlock) {
    return false;
  }

  const blockValue = Number.parseInt(firstBlock, 16);
  return Number.isInteger(blockValue) && blockValue >= 0xfe80 && blockValue <= 0xfebf;
}

function isPrivateOrReservedIp(ip: string) {
  const normalizedIp = normalizeIpAddress(ip);
  const ipVersion = isIP(normalizedIp);

  if (ipVersion === 4) {
    return isPrivateIpv4(normalizedIp);
  }

  if (ipVersion === 6) {
    return isPrivateIpv6(normalizedIp);
  }

  return false;
}

function maskIpForLog(ip: string) {
  if (ip.includes('.')) {
    const segments = ip.split('.');
    if (segments.length === 4) {
      return `${segments[0]}.${segments[1]}.${segments[2]}.*`;
    }
  }

  if (ip.includes(':')) {
    return `${ip.split(':').slice(0, 4).join(':')}::*`;
  }

  return ip;
}

function resolveDbPath(dbPath: string) {
  return isAbsolute(dbPath) ? dbPath : resolve(process.cwd(), dbPath);
}

function createFileSearcher(version: typeof IPv4 | typeof IPv6, dbPath: string) {
  const resolvedDbPath = resolveDbPath(dbPath);
  verifyFromFile(resolvedDbPath);
  const contentBuffer = loadContentFromFile(resolvedDbPath);
  const searcher = newWithBuffer(version, contentBuffer);
  return (ip: string) => searcher.search(ip);
}

function createRuntimeService(): RuntimeIpRegionService {
  const runtimeConfig = useRuntimeConfig();
  const provider = String(runtimeConfig.ipRegionProvider || 'ip2region').trim().toLowerCase();
  const logger = console;

  if (provider !== 'ip2region') {
    return createIpRegionService({ logger });
  }

  try {
    return createIpRegionService({
      searchIpv4: createFileSearcher(IPv4, String(runtimeConfig.ipRegionDbV4Path || 'server/resources/ip2region/ip2region_v4.xdb')),
      searchIpv6: createFileSearcher(IPv6, String(runtimeConfig.ipRegionDbV6Path || 'server/resources/ip2region/ip2region_v6.xdb')),
      logger,
    });
  }
  catch (error) {
    logger.warn('ip region service initialization failed', {
      message: error instanceof Error ? error.message : String(error),
    });

    return createIpRegionService({ logger });
  }
}

export function createIpRegionService(options: IpRegionServiceOptions = {}): RuntimeIpRegionService {
  const logger = options.logger ?? console;

  return {
    async resolveAuthorRegionByIp(ip: string | null | undefined) {
      const normalizedIp = normalizeIpAddress(ip);
      if (!normalizedIp) {
        return UNKNOWN_IP_REGION;
      }

      if (isPrivateOrReservedIp(normalizedIp)) {
        return PRIVATE_IP_REGION;
      }

      const ipVersion = isIP(normalizedIp);
      const searcher = ipVersion === 4 ? options.searchIpv4 : ipVersion === 6 ? options.searchIpv6 : undefined;

      if (!searcher) {
        return UNKNOWN_IP_REGION;
      }

      try {
        const rawRegion = await searcher(normalizedIp);
        const normalizedRegion = normalizeRegionName(rawRegion);
        return normalizedRegion || UNKNOWN_IP_REGION;
      }
      catch (error) {
        logger.warn?.('ip region lookup failed', {
          ip: maskIpForLog(normalizedIp),
          message: error instanceof Error ? error.message : String(error),
        });
        return UNKNOWN_IP_REGION;
      }
    },
  };
}

export function useIpRegionService() {
  if (!ipRegionServiceInstance) {
    ipRegionServiceInstance = createRuntimeService();
  }

  return ipRegionServiceInstance;
}

export async function resolveAuthorRegionByIp(ip: string | null | undefined) {
  return await useIpRegionService().resolveAuthorRegionByIp(ip);
}

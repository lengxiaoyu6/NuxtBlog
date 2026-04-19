import { describe, expect, it, vi } from 'vitest';
import { createIpRegionService, PRIVATE_IP_REGION, UNKNOWN_IP_REGION } from '../../../server/services/ip-region.service';

describe('createIpRegionService', () => {
  it('将中国省份规整为短名称', async () => {
    const service = createIpRegionService({
      searchIpv4: vi.fn().mockResolvedValue('中国|广东省|深圳市|电信|CN'),
      searchIpv6: vi.fn(),
      logger: { warn: vi.fn() },
    });

    await expect(service.resolveAuthorRegionByIp('113.118.113.77')).resolves.toBe('广东');
  });

  it('对内网地址返回固定文案', async () => {
    const service = createIpRegionService({
      searchIpv4: vi.fn(),
      searchIpv6: vi.fn(),
      logger: { warn: vi.fn() },
    });

    await expect(service.resolveAuthorRegionByIp('127.0.0.1')).resolves.toBe(PRIVATE_IP_REGION);
  });

  it('查询异常时回退到地区未知', async () => {
    const warn = vi.fn();
    const service = createIpRegionService({
      searchIpv4: vi.fn().mockRejectedValue(new Error('xdb missing')),
      searchIpv6: vi.fn(),
      logger: { warn },
    });

    await expect(service.resolveAuthorRegionByIp('113.118.113.77')).resolves.toBe(UNKNOWN_IP_REGION);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

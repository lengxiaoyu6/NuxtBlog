import { describe, expect, it, vi } from 'vitest';
import { createGuestbookService } from '../../../server/services/guestbook.service';

describe('createGuestbookService', () => {
  it('保存留言时写入解析后的地区', async () => {
    const createGuestbookEntryRecord = vi.fn();
    const resolveAuthorRegionByIp = vi.fn().mockResolvedValue('广东');
    const service = createGuestbookService({
      readGuestbookPageSettings: vi.fn().mockResolvedValue({ enabled: true }),
      readGuestbookEntryRecords: vi.fn(),
      findGuestbookEntryById: vi.fn().mockResolvedValue(null),
      createGuestbookEntryRecord,
      updateGuestbookEntryStatusRecord: vi.fn(),
      resolveAuthorRegionByIp,
      createError: (payload: { statusCode: number; statusMessage: string }) => Object.assign(new Error(payload.statusMessage), payload),
      now: () => new Date('2026-04-20T12:00:00.000Z'),
    });

    await service.createGuestbookEntry({
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      content: '留言内容',
    }, {
      clientIp: '113.118.113.77',
    });

    expect(resolveAuthorRegionByIp).toHaveBeenCalledWith('113.118.113.77');
    expect(createGuestbookEntryRecord).toHaveBeenCalledWith(expect.objectContaining({
      authorRegion: '广东',
    }));
  });

  it('地区解析失败时回退到地区未知', async () => {
    const createGuestbookEntryRecord = vi.fn();
    const service = createGuestbookService({
      readGuestbookPageSettings: vi.fn().mockResolvedValue({ enabled: true }),
      readGuestbookEntryRecords: vi.fn(),
      findGuestbookEntryById: vi.fn().mockResolvedValue(null),
      createGuestbookEntryRecord,
      updateGuestbookEntryStatusRecord: vi.fn(),
      resolveAuthorRegionByIp: vi.fn().mockRejectedValue(new Error('search failed')),
      createError: (payload: { statusCode: number; statusMessage: string }) => Object.assign(new Error(payload.statusMessage), payload),
      now: () => new Date('2026-04-20T12:00:00.000Z'),
    });

    await service.createGuestbookEntry({
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      content: '留言内容',
    }, {
      clientIp: '113.118.113.77',
    });

    expect(createGuestbookEntryRecord).toHaveBeenCalledWith(expect.objectContaining({
      authorRegion: '地区未知',
    }));
  });
});

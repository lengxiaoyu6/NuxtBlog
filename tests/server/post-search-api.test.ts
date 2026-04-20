import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  searchPublishedPosts: vi.fn(),
  getQuery: vi.fn(),
}));

vi.mock('../../server/services/post.service', () => ({
  searchPublishedPosts: mocks.searchPublishedPosts,
}));

describe('post search api', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler);
    vi.stubGlobal('getQuery', mocks.getQuery);
    mocks.searchPublishedPosts.mockResolvedValue([]);
  });

  it('读取字符串关键字并转交给搜索服务', async () => {
    mocks.getQuery.mockReturnValue({ keyword: 'Nuxt' });

    const handlerModule = await import('../../server/api/posts/search.get');
    await handlerModule.default({} as never);

    expect(mocks.searchPublishedPosts).toHaveBeenCalledWith('Nuxt');
  });

  it('关键字缺失或类型无效时传入空字符串', async () => {
    const handlerModule = await import('../../server/api/posts/search.get');

    mocks.getQuery.mockReturnValue({ keyword: ['Nuxt'] });
    await handlerModule.default({} as never);

    mocks.getQuery.mockReturnValue({});
    await handlerModule.default({} as never);

    expect(mocks.searchPublishedPosts).toHaveBeenNthCalledWith(1, '');
    expect(mocks.searchPublishedPosts).toHaveBeenNthCalledWith(2, '');
  });
});

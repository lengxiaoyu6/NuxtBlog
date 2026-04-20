import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readPublishedBlogPostSearchRecords: vi.fn(),
  searchPublishedBlogPostRecords: vi.fn(),
}));

vi.mock('../../../server/repositories/post.repository', async () => {
  const actual = await vi.importActual<typeof import('../../../server/repositories/post.repository')>(
    '../../../server/repositories/post.repository',
  );

  return {
    ...actual,
    readPublishedBlogPostSearchRecords: mocks.readPublishedBlogPostSearchRecords,
    searchPublishedBlogPostRecords: mocks.searchPublishedBlogPostRecords,
  };
});

const { searchPublishedPosts } = await import('../../../server/services/post.service');

describe('searchPublishedPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readPublishedBlogPostSearchRecords.mockResolvedValue([]);
    mocks.searchPublishedBlogPostRecords.mockResolvedValue([]);
  });

  it('空白关键字返回空数组，且不会触发仓库查询', async () => {
    await expect(searchPublishedPosts('   ')).resolves.toEqual([]);
    expect(mocks.searchPublishedBlogPostRecords).not.toHaveBeenCalled();
    expect(mocks.readPublishedBlogPostSearchRecords).not.toHaveBeenCalled();
  });

  it('将去首尾空白后的关键字与结果上限传给仓库层，并保持返回映射结构', async () => {
    mocks.readPublishedBlogPostSearchRecords.mockResolvedValue([
      {
        id: 3,
        slug: 'nuxt-search',
        title: 'Nuxt 搜索实现',
        excerpt: '数据库层搜索示例',
        contentMarkdown: '正文中提到 Nuxt 搜索',
        category: '前端',
        tagsJson: ['Nuxt'],
        publishedAt: new Date('2026-04-18T01:00:00.000Z'),
        updatedAt: new Date('2026-04-18T02:00:00.000Z'),
        createdAt: new Date('2026-04-17T08:00:00.000Z'),
      },
    ]);
    mocks.searchPublishedBlogPostRecords.mockResolvedValue([
      {
        id: 3,
        slug: 'nuxt-search',
        title: 'Nuxt 搜索实现',
        excerpt: '数据库层搜索示例',
        category: '前端',
        publishedAt: new Date('2026-04-18T01:00:00.000Z'),
        updatedAt: new Date('2026-04-18T02:00:00.000Z'),
        createdAt: new Date('2026-04-17T08:00:00.000Z'),
      },
      {
        id: 4,
        slug: null,
        title: '另一篇文章',
        excerpt: '继续验证日期映射',
        category: '后端',
        publishedAt: null,
        updatedAt: new Date('2026-04-19T03:00:00.000Z'),
        createdAt: new Date('2026-04-16T08:00:00.000Z'),
      },
    ]);

    await expect(searchPublishedPosts('  Nuxt  ')).resolves.toEqual([
      {
        id: 3,
        identifier: 'nuxt-search',
        title: 'Nuxt 搜索实现',
        excerpt: '数据库层搜索示例',
        category: '前端',
        date: '2026-04-18',
      },
      {
        id: 4,
        identifier: '4',
        title: '另一篇文章',
        excerpt: '继续验证日期映射',
        category: '后端',
        date: '2026-04-19',
      },
    ]);

    expect(mocks.searchPublishedBlogPostRecords).toHaveBeenCalledWith('Nuxt', 8);
    expect(mocks.readPublishedBlogPostSearchRecords).not.toHaveBeenCalled();
  });
});

import type { Prisma } from '@prisma/client';
import type { BlogPostStatus } from '../../shared/types/post';
import { usePrismaClient } from '../utils/prisma';

export interface ReadBlogPostRecordOptions {
  status?: BlogPostStatus;
  category?: string;
  keyword?: string;
}

export interface ReadAdminBlogPostListPageOptions extends ReadBlogPostRecordOptions {
  skip: number;
  take: number;
}

export interface SaveBlogPostRecordInput {
  title: string;
  slug: string | null;
  excerpt: string;
  contentMarkdown: string;
  category: string;
  tags: string[];
  coverImageUrl: string | null;
  status: BlogPostStatus;
  readTimeText: string;
  isPinned: boolean;
  publishedAt: Date | null;
}

export interface ReadPublishedBlogPostListPageOptions {
  category?: string;
  skip: number;
  take: number;
}

const publishedBlogPostOrderBy: Prisma.BlogPostOrderByWithRelationInput[] = [
  {
    isPinned: 'desc',
  },
  {
    publishedAt: 'desc',
  },
  {
    updatedAt: 'desc',
  },
  {
    createdAt: 'desc',
  },
];

const publicBlogPostListSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  tagsJson: true,
  coverImageUrl: true,
  publishedAt: true,
  createdAt: true,
  readTimeText: true,
  isPinned: true,
  likesCount: true,
} as const;

const publicBlogPostSearchSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  publishedAt: true,
  updatedAt: true,
  createdAt: true,
} as const;

const publicPopularBlogPostSelect = {
  id: true,
  slug: true,
  title: true,
  viewsCount: true,
  likesCount: true,
} as const;

const publicPostInteractionSelect = {
  viewsCount: true,
  likesCount: true,
} as const;

const publicBlogPostTagSelect = {
  tagsJson: true,
} as const;

const publicBlogPostFeedSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  publishedAt: true,
  updatedAt: true,
  createdAt: true,
} as const;

const adminBlogPostListSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  coverImageUrl: true,
  status: true,
  updatedAt: true,
  likesCount: true,
  viewsCount: true,
  _count: {
    select: {
      comments: true,
    },
  },
} as const;

const adminRecentBlogPostSelect = {
  id: true,
  title: true,
  updatedAt: true,
  status: true,
} as const;

const feedBlogPostOrderBy: Prisma.BlogPostOrderByWithRelationInput[] = [
  {
    publishedAt: 'desc',
  },
  {
    updatedAt: 'desc',
  },
  {
    createdAt: 'desc',
  },
];

const lastActivityBlogPostOrderBy: Prisma.BlogPostOrderByWithRelationInput[] = [
  {
    updatedAt: 'desc',
  },
  {
    publishedAt: 'desc',
  },
  {
    createdAt: 'desc',
  },
];

export type PublicBlogPostListRecord = Prisma.BlogPostGetPayload<{
  select: typeof publicBlogPostListSelect;
}>;

export type PublicBlogPostSearchRecord = Prisma.BlogPostGetPayload<{
  select: typeof publicBlogPostSearchSelect;
}>;

export type PopularBlogPostRecord = Prisma.BlogPostGetPayload<{
  select: typeof publicPopularBlogPostSelect;
}>;

export type PublicPostInteractionRecord = Prisma.BlogPostGetPayload<{
  select: typeof publicPostInteractionSelect;
}>;

export type PublishedBlogPostTagRecord = Prisma.BlogPostGetPayload<{
  select: typeof publicBlogPostTagSelect;
}>;

export type PublishedBlogPostFeedRecord = Prisma.BlogPostGetPayload<{
  select: typeof publicBlogPostFeedSelect;
}>;

export type AdminBlogPostListRecord = Prisma.BlogPostGetPayload<{
  select: typeof adminBlogPostListSelect;
}>;

export type AdminRecentBlogPostRecord = Prisma.BlogPostGetPayload<{
  select: typeof adminRecentBlogPostSelect;
}>;

export type PublishedBlogPostCategoryCountRecord = Awaited<ReturnType<typeof readPublishedBlogPostCategoryCounts>>[number];

function createAdminBlogPostWhere(options: ReadBlogPostRecordOptions = {}): Prisma.BlogPostWhereInput {
  const where: Prisma.BlogPostWhereInput = {};

  if (options.status) {
    where.status = options.status;
  }

  if (options.category) {
    where.category = options.category;
  }

  if (options.keyword) {
    where.OR = [
      {
        title: {
          contains: options.keyword,
        },
      },
      {
        excerpt: {
          contains: options.keyword,
        },
      },
      {
        slug: {
          contains: options.keyword,
        },
      },
    ];
  }

  return where;
}

function createPublishedBlogPostWhere(category?: string): Prisma.BlogPostWhereInput {
  const where: Prisma.BlogPostWhereInput = {
    status: 'published',
  };

  if (category) {
    where.category = category;
  }

  return where;
}

export async function readAdminBlogPostRecords(options: ReadBlogPostRecordOptions = {}) {
  const where = createAdminBlogPostWhere(options);
  return usePrismaClient().blogPost.findMany({
    where,
    orderBy: publishedBlogPostOrderBy,
  });
}

export async function readAdminBlogPostListPage(options: ReadAdminBlogPostListPageOptions) {
  const prisma = usePrismaClient();
  const where = createAdminBlogPostWhere(options);
  const [records, total] = await prisma.$transaction([
    prisma.blogPost.findMany({
      where,
      skip: options.skip,
      take: options.take,
      select: adminBlogPostListSelect,
      orderBy: publishedBlogPostOrderBy,
    }),
    prisma.blogPost.count({
      where,
    }),
  ]);

  return {
    records,
    total,
  };
}

export async function readAdminBlogPostDashboardStats() {
  const aggregate = await usePrismaClient().blogPost.aggregate({
    _count: {
      _all: true,
    },
    _sum: {
      viewsCount: true,
    },
  });

  return {
    totalPosts: aggregate._count._all,
    totalViews: aggregate._sum.viewsCount ?? 0,
  };
}

export async function readAdminRecentBlogPostRecords(limit = 5) {
  return usePrismaClient().blogPost.findMany({
    select: adminRecentBlogPostSelect,
    orderBy: [
      {
        updatedAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
    take: limit,
  });
}

export async function readPublishedBlogPostListPage(options: ReadPublishedBlogPostListPageOptions) {
  const prisma = usePrismaClient();
  const where = createPublishedBlogPostWhere(options.category);
  const [records, total] = await prisma.$transaction([
    prisma.blogPost.findMany({
      where,
      skip: options.skip,
      take: options.take,
      select: publicBlogPostListSelect,
      orderBy: publishedBlogPostOrderBy,
    }),
    prisma.blogPost.count({
      where,
    }),
  ]);

  return {
    records,
    total,
  };
}

export async function readPublishedBlogPostArchiveRecords() {
  return usePrismaClient().blogPost.findMany({
    where: createPublishedBlogPostWhere(),
    select: publicBlogPostListSelect,
    orderBy: publishedBlogPostOrderBy,
  });
}

export async function readPublishedBlogPostCategoryCounts() {
  return usePrismaClient().blogPost.groupBy({
    by: ['category'],
    where: createPublishedBlogPostWhere(),
    _count: {
      _all: true,
    },
  });
}

export async function searchPublishedBlogPostRecords(keyword: string, limit: number) {
  return usePrismaClient().blogPost.findMany({
    where: {
      ...createPublishedBlogPostWhere(),
      OR: [
        {
          title: {
            contains: keyword,
          },
        },
        {
          excerpt: {
            contains: keyword,
          },
        },
        {
          category: {
            contains: keyword,
          },
        },
      ],
    },
    select: publicBlogPostSearchSelect,
    orderBy: publishedBlogPostOrderBy,
    take: limit,
  });
}

export async function readPopularBlogPostRecords(limit = 5) {
  return usePrismaClient().blogPost.findMany({
    where: createPublishedBlogPostWhere(),
    select: publicPopularBlogPostSelect,
    orderBy: [
      {
        viewsCount: 'desc',
      },
      {
        likesCount: 'desc',
      },
      ...feedBlogPostOrderBy,
    ],
    take: limit,
  });
}

export async function readPublishedBlogPostTagRecords() {
  return usePrismaClient().blogPost.findMany({
    where: createPublishedBlogPostWhere(),
    select: publicBlogPostTagSelect,
  });
}

export async function readPublishedBlogPostStatsRecord() {
  const prisma = usePrismaClient();
  const publishedWhere = createPublishedBlogPostWhere();
  const [postCount, firstRecord, lastRecord] = await prisma.$transaction([
    prisma.blogPost.count({
      where: publishedWhere,
    }),
    prisma.blogPost.findFirst({
      where: publishedWhere,
      select: {
        publishedAt: true,
        createdAt: true,
      },
      orderBy: [
        {
          publishedAt: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    }),
    prisma.blogPost.findFirst({
      where: publishedWhere,
      select: {
        updatedAt: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: lastActivityBlogPostOrderBy,
    }),
  ]);

  return {
    postCount,
    startedAt: firstRecord?.publishedAt ?? firstRecord?.createdAt ?? null,
    lastActivityAt: lastRecord?.updatedAt ?? lastRecord?.publishedAt ?? lastRecord?.createdAt ?? null,
  };
}

export async function readPublishedBlogPostFeedRecords(category?: string) {
  return usePrismaClient().blogPost.findMany({
    where: createPublishedBlogPostWhere(category),
    select: publicBlogPostFeedSelect,
    orderBy: feedBlogPostOrderBy,
    take: 50,
  });
}

export async function findBlogPostRecordById(id: number) {
  return usePrismaClient().blogPost.findUnique({
    where: {
      id,
    },
  });
}

export async function findBlogPostRecordBySlug(slug: string) {
  return usePrismaClient().blogPost.findUnique({
    where: {
      slug,
    },
  });
}

export async function createBlogPostRecord(input: SaveBlogPostRecordInput) {
  return usePrismaClient().blogPost.create({
    data: {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      contentMarkdown: input.contentMarkdown,
      category: input.category,
      tagsJson: input.tags as Prisma.InputJsonValue,
      coverImageUrl: input.coverImageUrl,
      status: input.status,
      readTimeText: input.readTimeText,
      isPinned: input.isPinned,
      publishedAt: input.publishedAt,
    },
  });
}

export async function updateBlogPostRecord(id: number, input: SaveBlogPostRecordInput) {
  return usePrismaClient().blogPost.update({
    where: {
      id,
    },
    data: {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      contentMarkdown: input.contentMarkdown,
      category: input.category,
      tagsJson: input.tags as Prisma.InputJsonValue,
      coverImageUrl: input.coverImageUrl,
      status: input.status,
      readTimeText: input.readTimeText,
      isPinned: input.isPinned,
      publishedAt: input.publishedAt,
    },
  });
}

export async function incrementBlogPostViewsCount(id: number) {
  return usePrismaClient().blogPost.update({
    where: {
      id,
    },
    data: {
      viewsCount: {
        increment: 1,
      },
    },
    select: publicPostInteractionSelect,
  });
}

export async function incrementBlogPostLikesCount(id: number) {
  return usePrismaClient().blogPost.update({
    where: {
      id,
    },
    data: {
      likesCount: {
        increment: 1,
      },
    },
    select: publicPostInteractionSelect,
  });
}

export async function deleteBlogPostRecord(id: number) {
  return usePrismaClient().blogPost.delete({
    where: {
      id,
    },
  });
}

export async function bulkPublishBlogPostRecords(ids: number[], publishedAt: Date) {
  const prisma = usePrismaClient();
  const records = await prisma.blogPost.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      id: true,
      publishedAt: true,
    },
  });

  if (!records.length) {
    return 0;
  }

  await prisma.$transaction(
    records.map((record) =>
      prisma.blogPost.update({
        where: {
          id: record.id,
        },
        data: {
          status: 'published',
          publishedAt: record.publishedAt ?? publishedAt,
        },
      })
    )
  );

  return records.length;
}

export async function findPublishedBlogPostRecordById(id: number) {
  return usePrismaClient().blogPost.findFirst({
    where: {
      id,
      status: 'published',
    },
  });
}

export async function findPublishedBlogPostRecordBySlug(slug: string) {
  return usePrismaClient().blogPost.findFirst({
    where: {
      slug,
      status: 'published',
    },
  });
}

export async function readPublishedNeighborBlogPostRecords(publishedAt: Date, currentId: number, createdAt: Date) {
  const prisma = usePrismaClient();
  const [prevRecord, nextRecord] = await prisma.$transaction([
    prisma.blogPost.findFirst({
      where: {
        status: 'published',
        OR: [
          {
            publishedAt: {
              lt: publishedAt,
            },
          },
          {
            publishedAt,
            createdAt: {
              lt: createdAt,
            },
          },
        ],
        id: {
          not: currentId,
        },
      },
      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    }),
    prisma.blogPost.findFirst({
      where: {
        status: 'published',
        OR: [
          {
            publishedAt: {
              gt: publishedAt,
            },
          },
          {
            publishedAt,
            createdAt: {
              gt: createdAt,
            },
          },
        ],
        id: {
          not: currentId,
        },
      },
      orderBy: [
        {
          publishedAt: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    }),
  ]);

  return [prevRecord, nextRecord] as const;
}

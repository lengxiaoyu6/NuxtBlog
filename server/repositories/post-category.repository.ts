import { usePrismaClient } from '../utils/prisma';

export async function countBlogPostCategoryRecords() {
  return usePrismaClient().blogPostCategory.count();
}

export async function readBlogPostCategoryRecords() {
  return usePrismaClient().blogPostCategory.findMany({
    orderBy: [
      {
        sortOrder: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  });
}

export async function readBlogPostCategoryRecordsByNames(names: string[]) {
  if (names.length === 0) {
    return [];
  }

  return usePrismaClient().blogPostCategory.findMany({
    where: {
      name: {
        in: names,
      },
    },
  });
}

export async function readDistinctBlogPostCategoryNames() {
  const records = await usePrismaClient().blogPost.groupBy({
    by: ['category'],
    where: {
      category: {
        not: '',
      },
    },
  });

  return records.map((item) => item.category);
}

export async function readBlogPostCategoryStatusCountRecords() {
  return usePrismaClient().blogPost.groupBy({
    by: ['category', 'status'],
    where: {
      category: {
        not: '',
      },
    },
    _count: {
      _all: true,
    },
  });
}

export async function readMaxBlogPostCategorySortOrder() {
  return usePrismaClient().blogPostCategory.aggregate({
    _max: {
      sortOrder: true,
    },
  });
}

export async function findBlogPostCategoryRecordById(id: string) {
  return usePrismaClient().blogPostCategory.findUnique({
    where: {
      id,
    },
  });
}

export async function findBlogPostCategoryRecordByName(name: string, excludeId?: string) {
  return usePrismaClient().blogPostCategory.findFirst({
    where: {
      name,
      id: excludeId
        ? {
            not: excludeId,
          }
        : undefined,
    },
  });
}

export async function createBlogPostCategoryRecord(input: { name: string; sortOrder: number }) {
  return usePrismaClient().blogPostCategory.create({
    data: {
      name: input.name,
      sortOrder: input.sortOrder,
    },
  });
}

export async function renameBlogPostCategoryRecord(id: string, name: string) {
  return usePrismaClient().blogPostCategory.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
}

export async function renameBlogPostCategoryWithPosts(id: string, previousName: string, nextName: string) {
  const prisma = usePrismaClient();
  return prisma.$transaction(async (tx) => {
    const renamedRecord = await tx.blogPostCategory.update({
      where: {
        id,
      },
      data: {
        name: nextName,
      },
    });

    await tx.blogPost.updateMany({
      where: {
        category: previousName,
      },
      data: {
        category: nextName,
      },
    });

    return renamedRecord;
  });
}

export async function deleteBlogPostCategoryRecord(id: string) {
  return usePrismaClient().blogPostCategory.delete({
    where: {
      id,
    },
  });
}

export async function countBlogPostRecordsByCategory(category: string) {
  return usePrismaClient().blogPost.count({
    where: {
      category,
    },
  });
}

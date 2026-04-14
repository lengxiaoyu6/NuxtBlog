import type { AdminPostCategoryItem } from '../../app/types/admin-post-category';
import type {
  AdminPostCategoryCreateInput,
  AdminPostCategoryRenameInput,
} from '../../shared/types/post-category';
import {
  countBlogPostCategoryRecords,
  countBlogPostRecordsByCategory,
  createBlogPostCategoryRecord,
  deleteBlogPostCategoryRecord,
  findBlogPostCategoryRecordById,
  findBlogPostCategoryRecordByName,
  readBlogPostCategoryRecords,
  readBlogPostCategoryRecordsByNames,
  readBlogPostCategoryStatusCountRecords,
  readDistinctBlogPostCategoryNames,
  readMaxBlogPostCategorySortOrder,
  renameBlogPostCategoryWithPosts,
} from '../repositories/post-category.repository';
import { formatDateTimeInShanghai, isUniqueConstraintErrorForField } from './post.logic.mjs';

const DEFAULT_POST_CATEGORY_NAMES = ['设计', '开发', '生活', '随笔'];

interface CategoryCountState {
  total: number;
  draft: number;
  published: number;
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function ensurePostCategoryId(id: string) {
  const normalizedId = normalizeText(id);
  if (!normalizedId) {
    throw createError({
      statusCode: 400,
      statusMessage: '分类标识不能为空',
    });
  }

  return normalizedId;
}

function normalizePostCategoryName(value: unknown) {
  const normalizedName = normalizeText(value);
  if (!normalizedName || normalizedName.length > 40) {
    throw createError({
      statusCode: 400,
      statusMessage: '分类名称长度需在 1 到 40 个字符之间',
    });
  }

  return normalizedName;
}

function normalizeCreateInput(input: AdminPostCategoryCreateInput | null | undefined) {
  return {
    name: normalizePostCategoryName(input?.name),
  };
}

function normalizeRenameInput(input: AdminPostCategoryRenameInput | null | undefined) {
  return {
    name: normalizePostCategoryName(input?.name),
  };
}

function toCategoryCountMap(records: Awaited<ReturnType<typeof readBlogPostCategoryStatusCountRecords>>) {
  const map = new Map<string, CategoryCountState>();

  for (const record of records) {
    const state = map.get(record.category) ?? {
      total: 0,
      draft: 0,
      published: 0,
    };
    state.total += record._count._all;
    if (record.status === 'draft') {
      state.draft += record._count._all;
    }
    if (record.status === 'published') {
      state.published += record._count._all;
    }
    map.set(record.category, state);
  }

  return map;
}

function toAdminPostCategoryItem(
  record: Awaited<ReturnType<typeof readBlogPostCategoryRecords>>[number],
  countMap: Map<string, CategoryCountState>,
): AdminPostCategoryItem {
  const countState = countMap.get(record.name) ?? {
    total: 0,
    draft: 0,
    published: 0,
  };

  return {
    id: record.id,
    name: record.name,
    sortOrder: record.sortOrder,
    postCount: countState.total,
    draftPostCount: countState.draft,
    publishedPostCount: countState.published,
    createdAt: formatDateTimeInShanghai(record.createdAt),
    updatedAt: formatDateTimeInShanghai(record.updatedAt),
  };
}

async function ensurePostCategoryRecords(names: string[]) {
  const normalizedNames = Array.from(
    new Set(names.map((item) => normalizeText(item)).filter(Boolean))
  );
  if (normalizedNames.length === 0) {
    return;
  }

  const existingRecords = await readBlogPostCategoryRecordsByNames(normalizedNames);
  const existingNameSet = new Set(existingRecords.map((item) => item.name));
  const missingNames = normalizedNames.filter((name) => !existingNameSet.has(name));
  if (missingNames.length === 0) {
    return;
  }

  const maxSortOrderAggregate = await readMaxBlogPostCategorySortOrder();
  let nextSortOrder = (maxSortOrderAggregate._max.sortOrder ?? 0) + 1;
  for (const name of missingNames) {
    try {
      await createBlogPostCategoryRecord({
        name,
        sortOrder: nextSortOrder,
      });
      nextSortOrder += 1;
    } catch (error) {
      if (isUniqueConstraintErrorForField(error, 'name')) {
        continue;
      }

      throw error;
    }
  }
}

export async function ensureSeedBlogPostCategories() {
  const [categoryCount, categoryNamesFromPosts] = await Promise.all([
    countBlogPostCategoryRecords(),
    readDistinctBlogPostCategoryNames(),
  ]);

  if (categoryCount === 0) {
    await ensurePostCategoryRecords([...DEFAULT_POST_CATEGORY_NAMES, ...categoryNamesFromPosts]);
    return;
  }

  await ensurePostCategoryRecords(categoryNamesFromPosts);
}

export async function ensureAdminPostCategoryExists(name: string) {
  const normalizedName = normalizeText(name);
  if (!normalizedName) {
    return;
  }

  await ensureSeedBlogPostCategories();
  const existingRecord = await findBlogPostCategoryRecordByName(normalizedName);
  if (existingRecord) {
    return;
  }

  const maxSortOrderAggregate = await readMaxBlogPostCategorySortOrder();
  try {
    await createBlogPostCategoryRecord({
      name: normalizedName,
      sortOrder: (maxSortOrderAggregate._max.sortOrder ?? 0) + 1,
    });
  } catch (error) {
    if (isUniqueConstraintErrorForField(error, 'name')) {
      return;
    }

    throw error;
  }
}

export async function readAdminPostCategories() {
  await ensureSeedBlogPostCategories();

  const [categoryRecords, usageRecords] = await Promise.all([
    readBlogPostCategoryRecords(),
    readBlogPostCategoryStatusCountRecords(),
  ]);

  const countMap = toCategoryCountMap(usageRecords);
  return categoryRecords.map((record) => toAdminPostCategoryItem(record, countMap));
}

export async function createAdminPostCategory(input: AdminPostCategoryCreateInput | null | undefined) {
  await ensureSeedBlogPostCategories();
  const normalizedInput = normalizeCreateInput(input);
  const existingRecord = await findBlogPostCategoryRecordByName(normalizedInput.name);
  if (existingRecord) {
    throw createError({
      statusCode: 409,
      statusMessage: '分类名称已存在',
    });
  }

  const maxSortOrderAggregate = await readMaxBlogPostCategorySortOrder();
  const createdRecord = await createBlogPostCategoryRecord({
    name: normalizedInput.name,
    sortOrder: (maxSortOrderAggregate._max.sortOrder ?? 0) + 1,
  });

  return toAdminPostCategoryItem(createdRecord, new Map());
}

export async function renameAdminPostCategory(id: string, input: AdminPostCategoryRenameInput | null | undefined) {
  await ensureSeedBlogPostCategories();
  const normalizedId = ensurePostCategoryId(id);
  const normalizedInput = normalizeRenameInput(input);
  const existingRecord = await findBlogPostCategoryRecordById(normalizedId);
  if (!existingRecord) {
    throw createError({
      statusCode: 404,
      statusMessage: '分类不存在',
    });
  }

  const duplicatedRecord = await findBlogPostCategoryRecordByName(normalizedInput.name, normalizedId);
  if (duplicatedRecord) {
    throw createError({
      statusCode: 409,
      statusMessage: '分类名称已存在',
    });
  }

  const previousName = existingRecord.name;
  const renamedRecord = normalizedInput.name === previousName
    ? existingRecord
    : await renameBlogPostCategoryWithPosts(normalizedId, previousName, normalizedInput.name);

  const usageRecords = await readBlogPostCategoryStatusCountRecords();
  const countMap = toCategoryCountMap(usageRecords);
  return toAdminPostCategoryItem(renamedRecord, countMap);
}

export async function deleteAdminPostCategory(id: string) {
  await ensureSeedBlogPostCategories();
  const normalizedId = ensurePostCategoryId(id);
  const existingRecord = await findBlogPostCategoryRecordById(normalizedId);
  if (!existingRecord) {
    throw createError({
      statusCode: 404,
      statusMessage: '分类不存在',
    });
  }

  const postCount = await countBlogPostRecordsByCategory(existingRecord.name);
  if (postCount > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '分类下仍有文章，请先调整文章分类',
    });
  }

  await deleteBlogPostCategoryRecord(normalizedId);
  return {
    id: normalizedId,
  };
}

import type {
  AdminDashboardSummary,
  AdminPostDetail,
  AdminPostListItem,
  AdminPostListResponse,
  PublicPostDetail,
  PublicPostDetailResponse,
  PublicPostInteractionResponse,
  PublicPostListResponse,
  PublicPostArchiveResponse,
} from '../../app/types/post';
import type {
  PostInsightsResponse,
  PostSearchResultItem,
  PostTagInsightItem,
} from '../../app/types/post-discovery';
import type {
  AdminPostListQuery,
  AdminPostUpsertInput,
  BlogPostStatus,
  PublicPostListQuery,
} from '../../shared/types/post';
import {
  type AdminBlogPostListRecord,
  bulkPublishBlogPostRecords,
  createBlogPostRecord,
  deleteBlogPostRecord,
  findBlogPostRecordById,
  findBlogPostRecordBySlug,
  findPublishedBlogPostRecordById,
  findPublishedBlogPostRecordBySlug,
  incrementBlogPostLikesCount,
  incrementBlogPostViewsCount,
  readAdminBlogPostDashboardStats,
  readAdminBlogPostListPage,
  readAdminBlogPostRecords,
  readAdminRecentBlogPostRecords,
  readPublishedBlogPostArchiveRecords,
  readPublishedBlogPostCategoryCounts,
  readPublishedBlogPostFeedRecords,
  readPublishedBlogPostListPage,
  readPublishedNeighborBlogPostRecords,
  readPublishedBlogPostStatsRecord,
  readPublishedBlogPostTagRecords,
  readPopularBlogPostRecords,
  searchPublishedBlogPostRecords,
  updateBlogPostRecord,
} from '../repositories/post.repository';
import { countPendingPostCommentRecords, countPostCommentRecords } from '../repositories/post-comment.repository';
import {
  deletePostMediaAssetUsageRecords,
  readExistingMediaAssetIdRecords,
  replacePostMediaAssetUsageRecords,
} from '../repositories/media.repository';
import { ensureAdminPostCategoryExists } from './post-category.service';
import {
  createCategoryItems,
  estimateReadTimeText,
  formatDateInShanghai,
  formatDateTimeInShanghai,
  isUniqueConstraintErrorForField,
  normalizePostInput,
  parseTags,
  resolvePostPublicIdentifier,
  toPublicPostListItem,
} from './post.logic.mjs';
import { readSiteSettings } from './site-settings.service';

type BlogPostRecord = Awaited<ReturnType<typeof readAdminBlogPostRecords>>[number];
type NormalizedAdminPostInput = ReturnType<typeof normalizePostInput>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NUMERIC_SLUG_PATTERN = /^\d+$/;
const NUMERIC_POST_IDENTIFIER_PATTERN = /^[1-9]\d*$/;
const SEARCH_RESULT_LIMIT = 8;
const TAG_RESULT_LIMIT = 12;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ADMIN_POST_STATUSES: BlogPostStatus[] = ['draft', 'published'];
const MEDIA_FILE_PATH_PATTERN = /\/api(?:\/admin)?\/media\/files\/([^/?#\s]+)/i;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\(([^)]+)\)/g;
const MARKDOWN_LINK_PATTERN = /\[[^\]]*]\(([^)]+)\)/g;
const HTML_IMAGE_TAG_PATTERN = /<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi;
const HTML_LINK_TAG_PATTERN = /<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>/gi;

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAdminPostListQuery(query: AdminPostListQuery) {
  const status = normalizeText(query.status);
  const category = normalizeText(query.category);
  const keyword = normalizeText(query.keyword);
  const pageValue = Number(query.page);
  const pageSizeValue = Number(query.pageSize);
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const pageSize = Number.isInteger(pageSizeValue) && pageSizeValue > 0 ? Math.min(pageSizeValue, 50) : 10;

  if (status && !ADMIN_POST_STATUSES.includes(status as BlogPostStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章状态无效',
    });
  }

  return {
    status: status as BlogPostStatus | '',
    category,
    keyword,
    page,
    pageSize,
  };
}

function normalizePublicPostListQuery(query: PublicPostListQuery) {
  const pageValue = Number(query.page);
  const pageSizeValue = Number(query.pageSize);
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const pageSize = Number.isInteger(pageSizeValue) && pageSizeValue > 0 ? Math.min(pageSizeValue, 50) : 10;

  return {
    category: normalizeText(query.category),
    page,
    pageSize,
  };
}

function validateAdminPostInput(input: NormalizedAdminPostInput): asserts input is NormalizedAdminPostInput & { status: BlogPostStatus } {
  if (input.title.length < 2 || input.title.length > 120) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章标题长度需在 2 到 120 个字符之间',
    });
  }

  if (input.slug) {
    if (input.slug.length < 2 || input.slug.length > 80 || !SLUG_PATTERN.test(input.slug)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Slug 需为 2 到 80 个字符，仅允许小写字母、数字与中划线',
      });
    }

    if (NUMERIC_SLUG_PATTERN.test(input.slug)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Slug 不能为纯数字，请改用更明确的别名',
      });
    }
  }

  if (input.excerpt.length < 10 || input.excerpt.length > 400) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章摘要长度需在 10 到 400 个字符之间',
    });
  }

  if (!input.category || input.category.length > 40) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章分类长度需在 1 到 40 个字符之间',
    });
  }

  if (input.tags.some((item) => item.length > 20)) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章标签长度需控制在 20 个字符以内',
    });
  }

  if (input.coverImageUrl.length > 500) {
    throw createError({
      statusCode: 400,
      statusMessage: '封面地址长度需控制在 500 个字符以内',
    });
  }

  if (!ADMIN_POST_STATUSES.includes(input.status as BlogPostStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章状态无效',
    });
  }
}

async function assertSlugAvailable(slug: string, currentId?: number) {
  if (!slug) {
    return;
  }

  const existingRecord = await findBlogPostRecordBySlug(slug);

  if (existingRecord && existingRecord.id !== currentId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Slug 已存在，请更换后再保存',
    });
  }
}

function isSlugUniqueConstraintError(error: unknown) {
  return isUniqueConstraintErrorForField(error, 'slug');
}

function rethrowSlugConflictError(error: unknown): never {
  if (isSlugUniqueConstraintError(error)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Slug 已存在，请更换后再保存',
    });
  }

  throw error;
}

function ensurePostId(id: string | number) {
  const normalizedId = Number(id);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章标识不能为空',
    });
  }

  return normalizedId;
}

function ensurePostIdentifier(identifier: string) {
  const normalizedIdentifier = identifier.trim();

  if (!normalizedIdentifier) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章标识不能为空',
    });
  }

  return normalizedIdentifier;
}

function createTagInsightItems(records: Awaited<ReturnType<typeof readPublishedBlogPostTagRecords>>) {
  const tagCountMap = new Map<string, number>();

  for (const record of records) {
    for (const tag of parseTags(record.tagsJson)) {
      tagCountMap.set(tag, (tagCountMap.get(tag) ?? 0) + 1);
    }
  }

  return [...tagCountMap.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0], 'zh-Hans-CN');
    })
    .slice(0, TAG_RESULT_LIMIT)
    .map(([name, count]) => ({ name, count })) satisfies PostTagInsightItem[];
}

function calculateRunningDays(startedAt: Date | null, now: Date) {
  if (!startedAt) {
    return 0;
  }

  return Math.max(1, Math.ceil((now.getTime() - startedAt.getTime()) / DAY_IN_MS));
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRssDate(value: Date) {
  return value.toUTCString();
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizeMarkdownLinkTarget(rawTarget: string) {
  const trimmedTarget = normalizeText(rawTarget);
  const titleSeparatorIndex = trimmedTarget.search(/\s+"/);
  if (titleSeparatorIndex === -1) {
    return trimmedTarget;
  }

  return normalizeText(trimmedTarget.slice(0, titleSeparatorIndex));
}

function extractMediaAssetIdFromUrl(value: string) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return '';
  }

  const matched = normalizedValue.match(MEDIA_FILE_PATH_PATTERN);
  if (!matched?.[1]) {
    return '';
  }

  try {
    return normalizeText(decodeURIComponent(matched[1]));
  } catch {
    return normalizeText(matched[1]);
  }
}

function collectInlineImageMediaAssetIds(contentMarkdown: string) {
  const ids = new Set<string>();

  for (const match of contentMarkdown.matchAll(MARKDOWN_IMAGE_PATTERN)) {
    const target = normalizeMarkdownLinkTarget(match[1] ?? '');
    const assetId = extractMediaAssetIdFromUrl(target);
    if (assetId) {
      ids.add(assetId);
    }
  }

  for (const match of contentMarkdown.matchAll(HTML_IMAGE_TAG_PATTERN)) {
    const assetId = extractMediaAssetIdFromUrl(match[2] ?? '');
    if (assetId) {
      ids.add(assetId);
    }
  }

  return ids;
}

function collectAttachmentMediaAssetIds(contentMarkdown: string) {
  const ids = new Set<string>();

  for (const match of contentMarkdown.matchAll(MARKDOWN_LINK_PATTERN)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > 0 && contentMarkdown[matchIndex - 1] === '!') {
      continue;
    }

    const target = normalizeMarkdownLinkTarget(match[1] ?? '');
    const assetId = extractMediaAssetIdFromUrl(target);
    if (assetId) {
      ids.add(assetId);
    }
  }

  for (const match of contentMarkdown.matchAll(HTML_LINK_TAG_PATTERN)) {
    const assetId = extractMediaAssetIdFromUrl(match[2] ?? '');
    if (assetId) {
      ids.add(assetId);
    }
  }

  return ids;
}

async function syncPostMediaAssetUsage(input: {
  postId: string;
  postTitle: string;
  coverImageUrl: string | null;
  contentMarkdown: string;
}) {
  const coverAssetId = extractMediaAssetIdFromUrl(input.coverImageUrl ?? '');
  const inlineImageAssetIds = collectInlineImageMediaAssetIds(input.contentMarkdown);
  const attachmentAssetIds = collectAttachmentMediaAssetIds(input.contentMarkdown);
  const candidateIds = Array.from(new Set([
    ...(coverAssetId ? [coverAssetId] : []),
    ...inlineImageAssetIds,
    ...attachmentAssetIds,
  ]));

  if (candidateIds.length === 0) {
    await replacePostMediaAssetUsageRecords(input.postId, input.postTitle, []);
    return;
  }

  const existingRecords = await readExistingMediaAssetIdRecords(candidateIds);
  const existingIdSet = new Set(existingRecords.map((item) => item.id));
  const usageRecords: Array<{
    assetId: string;
    type: 'post_cover' | 'post_inline_image' | 'post_attachment';
  }> = [];

  if (coverAssetId && existingIdSet.has(coverAssetId)) {
    usageRecords.push({
      assetId: coverAssetId,
      type: 'post_cover',
    });
  }

  for (const assetId of inlineImageAssetIds) {
    if (!existingIdSet.has(assetId)) {
      continue;
    }

    usageRecords.push({
      assetId,
      type: 'post_inline_image',
    });
  }

  for (const assetId of attachmentAssetIds) {
    if (!existingIdSet.has(assetId)) {
      continue;
    }

    usageRecords.push({
      assetId,
      type: 'post_attachment',
    });
  }

  await replacePostMediaAssetUsageRecords(input.postId, input.postTitle, usageRecords);
}

function createRssItemXml(baseUrl: string, record: Awaited<ReturnType<typeof readPublishedBlogPostFeedRecords>>[number]) {
  const publishedAt = record.publishedAt ?? record.createdAt;
  const postLink = `${baseUrl}/post/${resolvePostPublicIdentifier(record)}`;

  return [
    '    <item>',
    `      <title>${escapeXml(record.title)}</title>`,
    `      <link>${escapeXml(postLink)}</link>`,
    `      <guid>${escapeXml(postLink)}</guid>`,
    `      <description>${escapeXml(record.excerpt)}</description>`,
    `      <category>${escapeXml(record.category)}</category>`,
    `      <pubDate>${formatRssDate(publishedAt)}</pubDate>`,
    '    </item>',
  ].join('\n');
}

function toAdminPostListItem(record: AdminBlogPostListRecord): AdminPostListItem {
  return {
    id: record.id,
    identifier: resolvePostPublicIdentifier(record),
    title: record.title,
    excerpt: record.excerpt,
    category: record.category,
    commentsCount: record._count.comments,
    likesCount: record.likesCount,
    viewsCount: record.viewsCount,
    updatedAt: formatDateTimeInShanghai(record.updatedAt),
    status: record.status,
    coverImageUrl: record.coverImageUrl,
  };
}

function toAdminPostDetail(record: BlogPostRecord): AdminPostDetail {
  return {
    id: record.id,
    identifier: resolvePostPublicIdentifier(record),
    title: record.title,
    excerpt: record.excerpt,
    category: record.category,
    commentsCount: record.commentsCount,
    likesCount: record.likesCount,
    viewsCount: record.viewsCount,
    updatedAt: formatDateTimeInShanghai(record.updatedAt),
    status: record.status,
    coverImageUrl: record.coverImageUrl,
    tags: parseTags(record.tagsJson),
    slug: record.slug ?? null,
    contentMarkdown: record.contentMarkdown,
    isPinned: record.isPinned,
    publishedAt: record.publishedAt ? formatDateTimeInShanghai(record.publishedAt) : null,
    createdAt: formatDateTimeInShanghai(record.createdAt),
  };
}

function toPublicPostDetail(record: BlogPostRecord): PublicPostDetail {
  return {
    ...toPublicPostListItem(record),
    contentMarkdown: record.contentMarkdown,
    commentsCount: record.commentsCount,
    viewsCount: record.viewsCount,
  };
}

export { estimateReadTimeText };

export async function readAdminPosts(query: AdminPostListQuery = {}): Promise<AdminPostListResponse> {
  const normalizedQuery = normalizeAdminPostListQuery(query);
  const offset = (normalizedQuery.page - 1) * normalizedQuery.pageSize;
  const { records, total } = await readAdminBlogPostListPage({
    status: normalizedQuery.status || undefined,
    category: normalizedQuery.category || undefined,
    keyword: normalizedQuery.keyword || undefined,
    skip: offset,
    take: normalizedQuery.pageSize,
  });

  return {
    items: records.map(toAdminPostListItem),
    total,
    page: normalizedQuery.page,
    pageSize: normalizedQuery.pageSize,
  };
}

export async function readAdminDashboardSummary() {
  const [postStats, totalComments, pendingComments, recentPosts] = await Promise.all([
    readAdminBlogPostDashboardStats(),
    countPostCommentRecords(),
    countPendingPostCommentRecords(),
    readAdminRecentBlogPostRecords(5),
  ]);

  return {
    stats: {
      totalPosts: postStats.totalPosts,
      totalComments,
      totalViews: postStats.totalViews,
      pendingComments,
    },
    recentPosts: recentPosts.map((item) => ({
      id: item.id,
      title: item.title,
      updatedAt: formatDateInShanghai(item.updatedAt),
      status: item.status,
    })),
  } satisfies AdminDashboardSummary;
}

export async function createAdminPost(input: AdminPostUpsertInput | null | undefined) {
  const normalizedInput = normalizePostInput(input);
  validateAdminPostInput(normalizedInput);
  await assertSlugAvailable(normalizedInput.slug);
  await ensureAdminPostCategoryExists(normalizedInput.category);

  try {
    const savedRecord = await createBlogPostRecord({
      title: normalizedInput.title,
      slug: normalizedInput.slug || null,
      excerpt: normalizedInput.excerpt,
      contentMarkdown: normalizedInput.contentMarkdown,
      category: normalizedInput.category,
      tags: normalizedInput.tags,
      coverImageUrl: normalizedInput.coverImageUrl || null,
      status: normalizedInput.status,
      readTimeText: estimateReadTimeText(normalizedInput.contentMarkdown),
      isPinned: normalizedInput.isPinned,
      publishedAt: normalizedInput.status === 'published' ? new Date() : null,
    });
    await syncPostMediaAssetUsage({
      postId: String(savedRecord.id),
      postTitle: savedRecord.title,
      coverImageUrl: savedRecord.coverImageUrl,
      contentMarkdown: savedRecord.contentMarkdown,
    });

    return toAdminPostDetail(savedRecord);
  } catch (error) {
    rethrowSlugConflictError(error);
  }
}

export async function readAdminPostDetail(id: string) {
  const normalizedId = ensurePostId(id);
  const record = await findBlogPostRecordById(normalizedId);

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: '文章不存在',
    });
  }

  return toAdminPostDetail(record);
}

export async function updateAdminPost(id: string, input: AdminPostUpsertInput | null | undefined) {
  const normalizedId = ensurePostId(id);
  const existingRecord = await findBlogPostRecordById(normalizedId);

  if (!existingRecord) {
    throw createError({
      statusCode: 404,
      statusMessage: '文章不存在',
    });
  }

  const normalizedInput = normalizePostInput(input);
  validateAdminPostInput(normalizedInput);
  await assertSlugAvailable(normalizedInput.slug, normalizedId);
  await ensureAdminPostCategoryExists(normalizedInput.category);
  const shouldSetPublishedAt = normalizedInput.status === 'published' && !existingRecord.publishedAt;

  try {
    const savedRecord = await updateBlogPostRecord(normalizedId, {
      title: normalizedInput.title,
      slug: normalizedInput.slug || null,
      excerpt: normalizedInput.excerpt,
      contentMarkdown: normalizedInput.contentMarkdown,
      category: normalizedInput.category,
      tags: normalizedInput.tags,
      coverImageUrl: normalizedInput.coverImageUrl || null,
      status: normalizedInput.status,
      readTimeText: estimateReadTimeText(normalizedInput.contentMarkdown),
      isPinned: normalizedInput.isPinned,
      publishedAt: shouldSetPublishedAt ? new Date() : existingRecord.publishedAt,
    });
    await syncPostMediaAssetUsage({
      postId: String(savedRecord.id),
      postTitle: savedRecord.title,
      coverImageUrl: savedRecord.coverImageUrl,
      contentMarkdown: savedRecord.contentMarkdown,
    });

    return toAdminPostDetail(savedRecord);
  } catch (error) {
    rethrowSlugConflictError(error);
  }
}

export async function deleteAdminPost(id: string) {
  const normalizedId = ensurePostId(id);
  const existingRecord = await findBlogPostRecordById(normalizedId);

  if (!existingRecord) {
    throw createError({
      statusCode: 404,
      statusMessage: '文章不存在',
    });
  }

  await deleteBlogPostRecord(normalizedId);
  await deletePostMediaAssetUsageRecords(String(normalizedId));

  return {
    ok: true,
  };
}

export async function bulkPublishAdminPosts(ids: number[]) {
  const normalizedIds = Array.from(
    new Set(
      (Array.isArray(ids) ? ids : [])
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  );

  if (!normalizedIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: '请选择至少一篇文章',
    });
  }

  const records = await Promise.all(normalizedIds.map((id) => findBlogPostRecordById(id)));
  if (records.some((item) => !item)) {
    throw createError({
      statusCode: 404,
      statusMessage: '存在已删除或不存在的文章',
    });
  }

  const updatedCount = await bulkPublishBlogPostRecords(normalizedIds, new Date());

  return {
    ok: true,
    updatedCount,
  };
}

export async function readPublicPosts(query: PublicPostListQuery = {}): Promise<PublicPostListResponse> {
  const normalizedQuery = normalizePublicPostListQuery(query);
  const offset = (normalizedQuery.page - 1) * normalizedQuery.pageSize;
  const [{ records, total }, categoryRecords] = await Promise.all([
    readPublishedBlogPostListPage({
      category: normalizedQuery.category || undefined,
      skip: offset,
      take: normalizedQuery.pageSize,
    }),
    readPublishedBlogPostCategoryCounts(),
  ]);

  return {
    items: records.map(toPublicPostListItem),
    total,
    page: normalizedQuery.page,
    pageSize: normalizedQuery.pageSize,
    categories: createCategoryItems(categoryRecords),
  };
}

export async function readPublicPostArchive(): Promise<PublicPostArchiveResponse> {
  const [publishedRecords, categoryRecords] = await Promise.all([
    readPublishedBlogPostArchiveRecords(),
    readPublishedBlogPostCategoryCounts(),
  ]);

  return {
    items: publishedRecords.map(toPublicPostListItem),
    categories: createCategoryItems(categoryRecords),
  };
}

async function findPublishedPostByIdentifierOrThrow(id: string) {
  const normalizedIdentifier = ensurePostIdentifier(id);
  const record = NUMERIC_POST_IDENTIFIER_PATTERN.test(normalizedIdentifier)
    ? await findPublishedBlogPostRecordById(Number(normalizedIdentifier))
    : await findPublishedBlogPostRecordBySlug(normalizedIdentifier);

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: '文章不存在',
    });
  }

  return record;
}

export async function readPublicPostDetail(id: string): Promise<PublicPostDetailResponse> {
  const record = await findPublishedPostByIdentifierOrThrow(id);

  const [prevRecord, nextRecord] = await readPublishedNeighborBlogPostRecords(
    record.publishedAt ?? record.createdAt,
    record.id,
    record.createdAt
  );

  return {
    post: toPublicPostDetail(record),
    prevPost: prevRecord
      ? {
          id: prevRecord.id,
          identifier: resolvePostPublicIdentifier(prevRecord),
          title: prevRecord.title,
        }
      : null,
    nextPost: nextRecord
      ? {
          id: nextRecord.id,
          identifier: resolvePostPublicIdentifier(nextRecord),
          title: nextRecord.title,
        }
      : null,
  };
}

export async function increasePublicPostViews(id: string): Promise<PublicPostInteractionResponse> {
  const record = await findPublishedPostByIdentifierOrThrow(id);
  return await incrementBlogPostViewsCount(record.id);
}

export async function increasePublicPostLikes(id: string): Promise<PublicPostInteractionResponse> {
  const record = await findPublishedPostByIdentifierOrThrow(id);
  return await incrementBlogPostLikesCount(record.id);
}

export async function searchPublishedPosts(keyword: string): Promise<PostSearchResultItem[]> {
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) {
    return [];
  }

  const records = await searchPublishedBlogPostRecords(normalizedKeyword, SEARCH_RESULT_LIMIT);

  return records.map((record) => ({
    id: record.id,
    identifier: resolvePostPublicIdentifier(record),
    title: record.title,
    excerpt: record.excerpt,
    category: record.category,
    date: formatDateInShanghai(record.publishedAt ?? record.updatedAt ?? record.createdAt),
  }));
}

export async function readPostInsights(): Promise<PostInsightsResponse> {
  const [categoryRecords, popularRecords, tagRecords, statsRecord] = await Promise.all([
    readPublishedBlogPostCategoryCounts(),
    readPopularBlogPostRecords(),
    readPublishedBlogPostTagRecords(),
    readPublishedBlogPostStatsRecord(),
  ]);
  const now = new Date();

  return {
    categories: createCategoryItems(categoryRecords),
    popularPosts: popularRecords.map((record) => ({
      id: record.id,
      identifier: resolvePostPublicIdentifier(record),
      title: record.title,
      viewsCount: record.viewsCount,
      likesCount: record.likesCount,
    })),
    tags: createTagInsightItems(tagRecords),
    stats: {
      postCount: statsRecord.postCount,
      runningDays: calculateRunningDays(statsRecord.startedAt, now),
      lastActivity: statsRecord.lastActivityAt ? formatDateTimeInShanghai(statsRecord.lastActivityAt) : null,
    },
  };
}

export async function readRssFeed(category?: string) {
  const normalizedCategory = normalizeText(category);
  const [siteSettings, items] = await Promise.all([
    readSiteSettings(),
    readPublishedBlogPostFeedRecords(normalizedCategory || undefined),
  ]);
  const baseUrl = trimTrailingSlash(siteSettings.site.url);
  const feedPath = normalizedCategory
    ? `/api/feed/${encodeURIComponent(normalizedCategory)}.xml`
    : '/api/feed.xml';
  const channelTitle = normalizedCategory ? `${siteSettings.site.name} - ${normalizedCategory}` : siteSettings.site.name;
  const channelDescription = normalizedCategory
    ? `${siteSettings.site.description} · ${normalizedCategory}`
    : siteSettings.site.description;
  const channelLink = normalizedCategory
    ? `${baseUrl}/?category=${encodeURIComponent(normalizedCategory)}`
    : baseUrl;
  const lastBuildDate = items[0]
    ? formatRssDate(items[0].updatedAt ?? items[0].publishedAt ?? items[0].createdAt)
    : formatRssDate(new Date());

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(channelTitle)}</title>`,
    `    <link>${escapeXml(channelLink)}</link>`,
    `    <description>${escapeXml(channelDescription)}</description>`,
    `    <language>zh-CN</language>`,
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `    <generator>Nuxt Nitro</generator>`,
    `    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(`${baseUrl}${feedPath}`)}" rel="self" type="application/rss+xml" />`,
    items.map((record) => createRssItemXml(baseUrl, record)).join('\n'),
    '  </channel>',
    '</rss>',
  ]
    .filter(Boolean)
    .join('\n');
}

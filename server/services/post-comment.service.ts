import { createError } from 'h3';
import type { AdminComment } from '../../app/types/admin-comment';
import type {
  AdminPostCommentListQuery,
  PostCommentStatus,
  PostCommentStatusUpdateInput,
  PostCommentSubmitInput,
} from '../../shared/types/post-comment';
import { findPublishedBlogPostRecordById, findPublishedBlogPostRecordBySlug } from '../repositories/post.repository';
import {
  createPostCommentRecord,
  findPostCommentRecordById,
  readAdminPostCommentRecords,
  readPostCommentRecordsByPostId,
  updatePostCommentStatusRecord,
} from '../repositories/post-comment.repository';
import { resolveAuthorRegionByIp } from './ip-region.service';
import { formatDateTimeInShanghai } from './post.logic.mjs';
import { createPostCommentService } from './post-comment.logic.mjs';

const NUMERIC_POST_IDENTIFIER_PATTERN = /^[1-9]\d*$/;

async function resolvePublishedPostByIdentifier(identifier: string) {
  const normalizedIdentifier = identifier.trim();

  if (!normalizedIdentifier) {
    return null;
  }

  if (NUMERIC_POST_IDENTIFIER_PATTERN.test(normalizedIdentifier)) {
    return await findPublishedBlogPostRecordById(Number(normalizedIdentifier));
  }

  return await findPublishedBlogPostRecordBySlug(normalizedIdentifier);
}

const postCommentService = createPostCommentService({
  resolvePublishedPost: resolvePublishedPostByIdentifier,
  readCommentsByPostId: readPostCommentRecordsByPostId,
  findCommentById: findPostCommentRecordById,
  createCommentRecord: createPostCommentRecord,
  resolveAuthorRegionByIp,
  createError,
  now: () => new Date(),
});

export async function readPublicPostComments(postId: string) {
  return await postCommentService.readPublicPostComments(postId);
}

export async function createPostComment(
  postId: string,
  input: PostCommentSubmitInput | null | undefined,
  options?: { clientIp?: string | null },
) {
  return await postCommentService.createPostComment(postId, input, options);
}

type AdminPostCommentRecord = Awaited<ReturnType<typeof readAdminPostCommentRecords>>[number];

const ADMIN_POST_COMMENT_STATUSES: PostCommentStatus[] = ['pending', 'approved', 'rejected', 'spam'];
const REVIEWABLE_POST_COMMENT_STATUSES: PostCommentStatusUpdateInput['status'][] = ['approved', 'rejected', 'spam'];

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAdminPostId(value: unknown) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
}

function normalizeAdminPostCommentListQuery(query: AdminPostCommentListQuery) {
  const status = normalizeText(query.status);

  if (status && !ADMIN_POST_COMMENT_STATUSES.includes(status as PostCommentStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: '评论状态无效',
    });
  }

  return {
    status: status as PostCommentStatus | '',
    postId: normalizeAdminPostId(query.postId),
    keyword: normalizeText(query.keyword),
  };
}

function validateReviewablePostCommentStatus(status: string) {
  if (REVIEWABLE_POST_COMMENT_STATUSES.includes(status as PostCommentStatusUpdateInput['status'])) {
    return status as PostCommentStatusUpdateInput['status'];
  }

  throw createError({
    statusCode: 400,
    statusMessage: '评论状态无效',
  });
}

function ensurePostCommentId(id: string) {
  const normalizedId = id.trim();

  if (!normalizedId) {
    throw createError({
      statusCode: 400,
      statusMessage: '评论标识不能为空',
    });
  }

  return normalizedId;
}

function createAdminPostComment(record: AdminPostCommentRecord): AdminComment {
  return {
    id: record.id,
    status: record.status,
    content: record.content,
    articleId: String(record.post.id),
    articleTitle: record.post.title,
    authorName: record.authorName,
    authorRegion: record.authorRegion,
    submittedAt: formatDateTimeInShanghai(record.submittedAt),
    replyToSummary: record.parent?.authorName,
  };
}

export async function readAdminPostComments(query: AdminPostCommentListQuery = {}) {
  const normalizedQuery = normalizeAdminPostCommentListQuery(query);
  const records = await readAdminPostCommentRecords({
    status: normalizedQuery.status || undefined,
    postId: normalizedQuery.postId ?? undefined,
    keyword: normalizedQuery.keyword || undefined,
  });

  return records.map(createAdminPostComment);
}

export async function updatePostCommentStatus(id: string, status: PostCommentStatusUpdateInput['status']) {
  const normalizedId = ensurePostCommentId(id);
  const existingRecord = await findPostCommentRecordById(normalizedId);

  if (!existingRecord) {
    throw createError({
      statusCode: 404,
      statusMessage: '评论不存在',
    });
  }

  const nextStatus = validateReviewablePostCommentStatus(status);
  const updatedRecord = await updatePostCommentStatusRecord(normalizedId, nextStatus);

  return createAdminPostComment(updatedRecord);
}

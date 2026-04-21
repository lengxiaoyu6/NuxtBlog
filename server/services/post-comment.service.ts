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
import { emitPostCommentCreated, emitPostCommentReviewed } from './notification-event.service';
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
  emitPostCommentCreated,
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
type PostCommentRecord = NonNullable<Awaited<ReturnType<typeof findPostCommentRecordById>>>;

const ADMIN_POST_COMMENT_STATUSES: PostCommentStatus[] = ['pending', 'approved', 'rejected', 'spam'];
const REVIEWABLE_POST_COMMENT_STATUSES: PostCommentStatusUpdateInput['status'][] = ['approved', 'rejected', 'spam'];

interface AdminPostCommentServiceDependencies {
  readAdminPostCommentRecords?: typeof readAdminPostCommentRecords;
  findPostCommentById?: typeof findPostCommentRecordById;
  updatePostCommentStatusRecord?: typeof updatePostCommentStatusRecord;
  createError?: typeof createError;
  emitPostCommentReviewed?: (payload: {
    id: string;
    postId: number;
    postTitle: string;
    parentId: string | null;
    parentAuthorEmail: string;
    authorName: string;
    authorEmail: string;
    authorRegion: string;
    content: string;
    previousStatus: PostCommentStatus;
    status: PostCommentStatus;
    submittedAt: string;
    reviewedAt: string | null;
  }) => Promise<void> | void;
}

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

function createPostCommentReviewedPayload(record: AdminPostCommentRecord, previousRecord: PostCommentRecord) {
  return {
    id: record.id,
    postId: record.post.id,
    postTitle: record.post.title,
    parentId: record.parentId,
    parentAuthorEmail: record.parent?.authorEmail ?? '',
    authorName: record.authorName,
    authorEmail: record.authorEmail,
    authorRegion: record.authorRegion,
    content: record.content,
    previousStatus: previousRecord.status,
    status: record.status,
    submittedAt: record.submittedAt.toISOString(),
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
  };
}

export function createAdminPostCommentService(dependencies: AdminPostCommentServiceDependencies = {}) {
  const {
    readAdminPostCommentRecords: readAdminPostCommentRecordsImpl = readAdminPostCommentRecords,
    findPostCommentById: findPostCommentByIdImpl = findPostCommentRecordById,
    updatePostCommentStatusRecord: updatePostCommentStatusRecordImpl = updatePostCommentStatusRecord,
    createError: createErrorImpl = createError,
    emitPostCommentReviewed = async () => {},
  } = dependencies;

  return {
    async readAdminPostComments(query: AdminPostCommentListQuery = {}) {
      const normalizedQuery = normalizeAdminPostCommentListQuery(query);
      const records = await readAdminPostCommentRecordsImpl({
        status: normalizedQuery.status || undefined,
        postId: normalizedQuery.postId ?? undefined,
        keyword: normalizedQuery.keyword || undefined,
      });

      return records.map(createAdminPostComment);
    },
    async updatePostCommentStatus(id: string, status: PostCommentStatusUpdateInput['status']) {
      const normalizedId = ensurePostCommentId(id);
      const existingRecord = await findPostCommentByIdImpl(normalizedId);

      if (!existingRecord) {
        throw createErrorImpl({
          statusCode: 404,
          statusMessage: '评论不存在',
        });
      }

      const nextStatus = validateReviewablePostCommentStatus(status);
      const updatedRecord = await updatePostCommentStatusRecordImpl(normalizedId, nextStatus);

      await emitPostCommentReviewed(createPostCommentReviewedPayload(updatedRecord, existingRecord));

      return createAdminPostComment(updatedRecord);
    },
  };
}

const adminPostCommentService = createAdminPostCommentService({
  emitPostCommentReviewed,
});

export async function readAdminPostComments(query: AdminPostCommentListQuery = {}) {
  return await adminPostCommentService.readAdminPostComments(query);
}

export async function updatePostCommentStatus(id: string, status: PostCommentStatusUpdateInput['status']) {
  return await adminPostCommentService.updatePostCommentStatus(id, status);
}

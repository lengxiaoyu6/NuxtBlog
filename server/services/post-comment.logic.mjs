import { createHash } from 'node:crypto';

export const POST_COMMENT_NAME_MIN_LENGTH = 2;
export const POST_COMMENT_NAME_MAX_LENGTH = 24;
export const POST_COMMENT_EMAIL_MAX_LENGTH = 320;
export const POST_COMMENT_CONTENT_MAX_LENGTH = 1000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POST_COMMENT_SUBMIT_SUCCESS_MESSAGE = '评论已提交，等待审核后展示';
const UNKNOWN_AUTHOR_REGION = '地区未知';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatSubmittedAt(value) {
  return value.toISOString();
}

function createPublicCommentItem(record) {
  return {
    id: record.id,
    parentId: record.parentId,
    authorName: record.authorName,
    authorAvatarUrl: record.authorAvatarUrl,
    authorRegion: record.authorRegion,
    content: record.content,
    submittedAt: formatSubmittedAt(record.submittedAt),
    replies: [],
  };
}

export function createCommentAvatar(authorName) {
  const avatarSeed = createHash('sha1').update(authorName).digest('hex').slice(0, 16);
  return `https://picsum.photos/seed/post-comment-${avatarSeed}/100/100`;
}

export function normalizePostCommentSubmitInput(input) {
  return {
    parentId: normalizeText(input?.parentId),
    authorName: normalizeText(input?.authorName),
    authorEmail: normalizeText(input?.authorEmail),
    content: normalizeText(input?.content),
  };
}

export function validatePostCommentInput(input, createError) {
  if (input.authorName.length < POST_COMMENT_NAME_MIN_LENGTH || input.authorName.length > POST_COMMENT_NAME_MAX_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: '昵称长度需在 2 到 24 个字符之间',
    });
  }

  if (input.authorEmail.length > POST_COMMENT_EMAIL_MAX_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: '邮箱地址长度不能超过 320 个字符',
    });
  }

  if (!EMAIL_PATTERN.test(input.authorEmail)) {
    throw createError({
      statusCode: 400,
      statusMessage: '请输入有效的邮箱地址',
    });
  }

  if (!input.content || input.content.length > POST_COMMENT_CONTENT_MAX_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: '评论内容长度需在 1 到 1000 个字符之间',
    });
  }
}

export function buildApprovedCommentTree(records) {
  const approvedRecords = records.filter((item) => item.status === 'approved');
  const nodeMap = new Map();
  const roots = [];

  for (const record of approvedRecords) {
    nodeMap.set(record.id, createPublicCommentItem(record));
  }

  for (const record of approvedRecords) {
    const node = nodeMap.get(record.id);

    if (!node) {
      continue;
    }

    if (record.parentId) {
      const parentNode = nodeMap.get(record.parentId);

      if (!parentNode) {
        continue;
      }

      parentNode.replies = [...parentNode.replies, node];
      continue;
    }

    roots.push(node);
  }

  return roots;
}

function ensurePostIdentifier(postIdentifier, createError) {
  const normalizedPostIdentifier = normalizeText(postIdentifier);

  if (!normalizedPostIdentifier) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章标识不能为空',
    });
  }

  return normalizedPostIdentifier;
}

export function createPostCommentService(dependencies) {
  const {
    resolvePublishedPost,
    readCommentsByPostId,
    findCommentById,
    createCommentRecord,
    resolveAuthorRegionByIp = async () => UNKNOWN_AUTHOR_REGION,
    emitPostCommentCreated = async () => {},
    createError,
    now = () => new Date(),
  } = dependencies;

  async function assertPublishedPostExists(postIdentifier) {
    const normalizedPostIdentifier = ensurePostIdentifier(postIdentifier, createError);
    const postRecord = await resolvePublishedPost(normalizedPostIdentifier);

    if (!postRecord) {
      throw createError({
        statusCode: 404,
        statusMessage: '文章不存在',
      });
    }

    return postRecord;
  }

  async function assertParentCommentAvailable(postId, parentId) {
    const parentRecord = await findCommentById(parentId);

    if (!parentRecord || parentRecord.postId !== postId) {
      throw createError({
        statusCode: 404,
        statusMessage: '回复目标不存在',
      });
    }
  }

  return {
    async readPublicPostComments(postId) {
      const postRecord = await assertPublishedPostExists(postId);
      const records = await readCommentsByPostId(postRecord.id);
      return buildApprovedCommentTree(records);
    },
    async createPostComment(postId, input, options = {}) {
      const postRecord = await assertPublishedPostExists(postId);
      const normalizedInput = normalizePostCommentSubmitInput(input);

      validatePostCommentInput(normalizedInput, createError);

      if (normalizedInput.parentId) {
        await assertParentCommentAvailable(postRecord.id, normalizedInput.parentId);
      }

      let authorRegion = UNKNOWN_AUTHOR_REGION;
      try {
        authorRegion = await resolveAuthorRegionByIp(options.clientIp);
      }
      catch {
        authorRegion = UNKNOWN_AUTHOR_REGION;
      }

      const createdRecord = await createCommentRecord({
        postId: postRecord.id,
        parentId: normalizedInput.parentId || null,
        authorName: normalizedInput.authorName,
        authorEmail: normalizedInput.authorEmail,
        authorAvatarUrl: createCommentAvatar(normalizedInput.authorName),
        authorRegion,
        content: normalizedInput.content,
        submittedAt: now(),
      });

      if (createdRecord) {
        await emitPostCommentCreated({
          id: createdRecord.id,
          postId: createdRecord.postId,
          postTitle: postRecord.title,
          parentId: createdRecord.parentId,
          authorName: createdRecord.authorName,
          authorEmail: createdRecord.authorEmail,
          authorRegion: createdRecord.authorRegion,
          content: createdRecord.content,
          status: createdRecord.status,
          submittedAt: createdRecord.submittedAt.toISOString(),
        });
      }

      return {
        ok: true,
        message: POST_COMMENT_SUBMIT_SUCCESS_MESSAGE,
      };
    },
  };
}

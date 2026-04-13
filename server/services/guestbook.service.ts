import type { AdminComment, AdminCommentStatus } from '../../app/types/admin-comment';
import type { CommentItemData } from '../../app/types/comment';
import type { GuestbookEntrySubmitInput, GuestbookStatusUpdateInput } from '../../shared/types/guestbook';
import {
  createGuestbookEntryRecord,
  findGuestbookEntryRecordById,
  readGuestbookEntryRecords,
  updateGuestbookEntryStatusRecord,
} from '../repositories/guestbook.repository';
import { readGuestbookPageSettings } from './page-settings.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type GuestbookRecord = Awaited<ReturnType<typeof readGuestbookEntryRecords>>[number];

function formatSubmittedAt(value: Date) {
  return value.toISOString().slice(0, 16).replace('T', ' ');
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function createCommentNode(record: GuestbookRecord): CommentItemData {
  return {
    id: record.id,
    author: record.authorName,
    avatar: record.authorAvatarUrl,
    date: formatDate(record.submittedAt),
    submittedAt: formatSubmittedAt(record.submittedAt),
    region: record.authorRegion,
    content: record.content,
    likes: 0,
    status: record.status as AdminCommentStatus,
    replies: [],
  };
}

function createAdminComment(record: GuestbookRecord, parentRecord?: GuestbookRecord): AdminComment {
  return {
    id: record.id,
    status: record.status as AdminCommentStatus,
    content: record.content,
    articleId: 'guestbook',
    articleTitle: '留言板',
    authorName: record.authorName,
    authorRegion: record.authorRegion,
    submittedAt: formatSubmittedAt(record.submittedAt),
    replyToSummary: parentRecord?.authorName,
  };
}

function validateGuestbookEntryInput(input: GuestbookEntrySubmitInput) {
  const authorName = input.authorName?.trim() || '';
  const authorEmail = input.authorEmail?.trim() || '';
  const content = input.content?.trim() || '';

  if (authorName.length < 2 || authorName.length > 24) {
    throw createError({
      statusCode: 400,
      statusMessage: '昵称长度需在 2 到 24 个字符之间',
    });
  }

  if (!EMAIL_PATTERN.test(authorEmail)) {
    throw createError({
      statusCode: 400,
      statusMessage: '请输入有效的邮箱地址',
    });
  }

  if (!content || content.length > 1000) {
    throw createError({
      statusCode: 400,
      statusMessage: '留言内容长度需在 1 到 1000 个字符之间',
    });
  }
}

function validateGuestbookStatus(status: GuestbookStatusUpdateInput['status']) {
  if (status === 'approved' || status === 'rejected' || status === 'spam') {
    return status;
  }

  throw createError({
    statusCode: 400,
    statusMessage: '留言状态无效',
  });
}

export async function readPublicGuestbookEntries() {
  const records = await readGuestbookEntryRecords();
  const approvedRecords = records.filter((item) => item.status === 'approved');
  const nodeMap = new Map<string, CommentItemData>();
  const roots: CommentItemData[] = [];

  for (const record of approvedRecords) {
    nodeMap.set(record.id, createCommentNode(record));
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

      parentNode.replies = [...(parentNode.replies ?? []), node];
      continue;
    }

    roots.push(node);
  }

  return roots;
}

export async function createGuestbookEntry(input: GuestbookEntrySubmitInput) {
  validateGuestbookEntryInput(input);

  const guestbookPageSettings = await readGuestbookPageSettings();
  if (!guestbookPageSettings.enabled) {
    throw createError({
      statusCode: 409,
      statusMessage: '留言板当前未开放提交',
    });
  }

  const parentId = input.parentId?.trim() || '';
  if (parentId) {
    const parentRecord = await findGuestbookEntryRecordById(parentId);
    if (!parentRecord) {
      throw createError({
        statusCode: 404,
        statusMessage: '回复目标不存在',
      });
    }
  }

  await createGuestbookEntryRecord({
    parentId: parentId || null,
    authorName: input.authorName.trim(),
    authorEmail: input.authorEmail.trim(),
    authorAvatarUrl: `https://picsum.photos/seed/${encodeURIComponent(input.authorName.trim())}/100/100`,
    authorRegion: '来自互联网',
    content: input.content.trim(),
    submittedAt: new Date(),
  });

  return {
    ok: true,
    message: '留言已提交，等待审核后展示',
  };
}

export async function readAdminGuestbookComments() {
  const records = await readGuestbookEntryRecords();
  const recordMap = new Map(records.map((item) => [item.id, item]));

  return records.map((record) => createAdminComment(record, record.parentId ? recordMap.get(record.parentId) : undefined));
}

export async function updateGuestbookEntryStatus(id: string, status: GuestbookStatusUpdateInput['status']) {
  if (!id.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: '留言标识不能为空',
    });
  }

  const existingRecord = await findGuestbookEntryRecordById(id);
  if (!existingRecord) {
    throw createError({
      statusCode: 404,
      statusMessage: '留言不存在',
    });
  }

  const nextStatus = validateGuestbookStatus(status);
  const updatedRecord = await updateGuestbookEntryStatusRecord(id, nextStatus);
  const parentRecord = updatedRecord.parentId ? await findGuestbookEntryRecordById(updatedRecord.parentId) : null;

  return createAdminComment(updatedRecord, parentRecord ?? undefined);
}

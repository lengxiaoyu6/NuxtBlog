import { createError } from 'h3';
import type { AdminComment, AdminCommentStatus } from '../../app/types/admin-comment';
import type { CommentItemData } from '../../app/types/comment';
import type { GuestbookEntrySubmitInput, GuestbookStatusUpdateInput } from '../../shared/types/guestbook';
import {
  createGuestbookEntryRecord,
  findGuestbookEntryRecordById,
  readGuestbookEntryRecords,
  updateGuestbookEntryStatusRecord,
} from '../repositories/guestbook.repository';
import { UNKNOWN_IP_REGION, resolveAuthorRegionByIp } from './ip-region.service';
import {
  type GuestbookCreatedEventPayload,
  type GuestbookReviewedEventPayload,
  emitGuestbookCreated,
  emitGuestbookReviewed,
} from './notification-event.service';
import { readGuestbookPageSettings } from './page-settings.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type GuestbookRecord = Awaited<ReturnType<typeof readGuestbookEntryRecords>>[number];
type GuestbookPageSettings = Awaited<ReturnType<typeof readGuestbookPageSettings>>;

interface GuestbookServiceDependencies {
  readGuestbookPageSettings?: () => Promise<GuestbookPageSettings>;
  readGuestbookEntryRecords?: typeof readGuestbookEntryRecords;
  findGuestbookEntryById?: typeof findGuestbookEntryRecordById;
  createGuestbookEntryRecord?: typeof createGuestbookEntryRecord;
  updateGuestbookEntryStatusRecord?: typeof updateGuestbookEntryStatusRecord;
  resolveAuthorRegionByIp?: (ip: string | null | undefined) => Promise<string>;
  emitGuestbookCreated?: (payload: GuestbookCreatedEventPayload) => Promise<void> | void;
  emitGuestbookReviewed?: (payload: GuestbookReviewedEventPayload) => Promise<void> | void;
  createError?: typeof createError;
  now?: () => Date;
}

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

function validateGuestbookEntryInput(input: GuestbookEntrySubmitInput, createErrorImpl: typeof createError) {
  const authorName = input.authorName?.trim() || '';
  const authorEmail = input.authorEmail?.trim() || '';
  const content = input.content?.trim() || '';

  if (authorName.length < 2 || authorName.length > 24) {
    throw createErrorImpl({
      statusCode: 400,
      statusMessage: '昵称长度需在 2 到 24 个字符之间',
    });
  }

  if (!EMAIL_PATTERN.test(authorEmail)) {
    throw createErrorImpl({
      statusCode: 400,
      statusMessage: '请输入有效的邮箱地址',
    });
  }

  if (!content || content.length > 1000) {
    throw createErrorImpl({
      statusCode: 400,
      statusMessage: '留言内容长度需在 1 到 1000 个字符之间',
    });
  }
}

function validateGuestbookStatus(status: GuestbookStatusUpdateInput['status'], createErrorImpl: typeof createError) {
  if (status === 'approved' || status === 'rejected' || status === 'spam') {
    return status;
  }

  throw createErrorImpl({
    statusCode: 400,
    statusMessage: '留言状态无效',
  });
}

export function createGuestbookService(dependencies: GuestbookServiceDependencies = {}) {
  const {
    readGuestbookPageSettings: readGuestbookPageSettingsImpl = readGuestbookPageSettings,
    readGuestbookEntryRecords: readGuestbookEntryRecordsImpl = readGuestbookEntryRecords,
    findGuestbookEntryById: findGuestbookEntryByIdImpl = findGuestbookEntryRecordById,
    createGuestbookEntryRecord: createGuestbookEntryRecordImpl = createGuestbookEntryRecord,
    updateGuestbookEntryStatusRecord: updateGuestbookEntryStatusRecordImpl = updateGuestbookEntryStatusRecord,
    resolveAuthorRegionByIp: resolveAuthorRegionByIpImpl = resolveAuthorRegionByIp,
    emitGuestbookCreated = async () => {},
    emitGuestbookReviewed = async () => {},
    createError: createErrorImpl = createError,
    now = () => new Date(),
  } = dependencies;

  return {
    async readPublicGuestbookEntries() {
      const records = await readGuestbookEntryRecordsImpl();
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
    },
    async createGuestbookEntry(input: GuestbookEntrySubmitInput, options?: { clientIp?: string | null }) {
      validateGuestbookEntryInput(input, createErrorImpl);

      const guestbookPageSettings = await readGuestbookPageSettingsImpl();
      if (!guestbookPageSettings.enabled) {
        throw createErrorImpl({
          statusCode: 409,
          statusMessage: '留言板当前未开放提交',
        });
      }

      const parentId = input.parentId?.trim() || '';
      if (parentId) {
        const parentRecord = await findGuestbookEntryByIdImpl(parentId);
        if (!parentRecord) {
          throw createErrorImpl({
            statusCode: 404,
            statusMessage: '回复目标不存在',
          });
        }
      }

      let authorRegion = UNKNOWN_IP_REGION;
      try {
        authorRegion = await resolveAuthorRegionByIpImpl(options?.clientIp);
      }
      catch {
        authorRegion = UNKNOWN_IP_REGION;
      }

      const createdRecord = await createGuestbookEntryRecordImpl({
        parentId: parentId || null,
        authorName: input.authorName.trim(),
        authorEmail: input.authorEmail.trim(),
        authorAvatarUrl: `https://picsum.photos/seed/${encodeURIComponent(input.authorName.trim())}/100/100`,
        authorRegion,
        content: input.content.trim(),
        submittedAt: now(),
      });

      if (createdRecord) {
        await emitGuestbookCreated({
          id: createdRecord.id,
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
        message: '留言已提交，等待审核后展示',
      };
    },
    async readAdminGuestbookComments() {
      const records = await readGuestbookEntryRecordsImpl();
      const recordMap = new Map(records.map((item) => [item.id, item]));

      return records.map((record) => createAdminComment(record, record.parentId ? recordMap.get(record.parentId) : undefined));
    },
    async updateGuestbookEntryStatus(id: string, status: GuestbookStatusUpdateInput['status']) {
      if (!id.trim()) {
        throw createErrorImpl({
          statusCode: 400,
          statusMessage: '留言标识不能为空',
        });
      }

      const existingRecord = await findGuestbookEntryByIdImpl(id);
      if (!existingRecord) {
        throw createErrorImpl({
          statusCode: 404,
          statusMessage: '留言不存在',
        });
      }

      const nextStatus = validateGuestbookStatus(status, createErrorImpl);
      const updatedRecord = await updateGuestbookEntryStatusRecordImpl(id, nextStatus);

      await emitGuestbookReviewed({
        id: updatedRecord.id,
        parentId: updatedRecord.parentId,
        authorName: updatedRecord.authorName,
        authorEmail: updatedRecord.authorEmail,
        authorRegion: updatedRecord.authorRegion,
        content: updatedRecord.content,
        previousStatus: existingRecord.status,
        status: updatedRecord.status,
        submittedAt: updatedRecord.submittedAt.toISOString(),
        reviewedAt: updatedRecord.reviewedAt?.toISOString() ?? null,
      });

      const parentRecord = updatedRecord.parentId ? await findGuestbookEntryByIdImpl(updatedRecord.parentId) : null;

      return createAdminComment(updatedRecord, parentRecord ?? undefined);
    },
  };
}

const guestbookService = createGuestbookService({
  emitGuestbookCreated,
  emitGuestbookReviewed,
});

export async function readPublicGuestbookEntries() {
  return await guestbookService.readPublicGuestbookEntries();
}

export async function createGuestbookEntry(input: GuestbookEntrySubmitInput, options?: { clientIp?: string | null }) {
  return await guestbookService.createGuestbookEntry(input, options);
}

export async function readAdminGuestbookComments() {
  return await guestbookService.readAdminGuestbookComments();
}

export async function updateGuestbookEntryStatus(id: string, status: GuestbookStatusUpdateInput['status']) {
  return await guestbookService.updateGuestbookEntryStatus(id, status);
}

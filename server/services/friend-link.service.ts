import type { AdminFriendLinkItem } from '../../app/types/friend-link';
import type { FriendLinkApplicationSubmitInput, AdminFriendLinkSaveInput, FriendLinkRecordStatus } from '../../shared/types/friend-link';
import {
  createFriendLinkRecord,
  deleteFriendLinkRecord,
  findFriendLinkRecordById,
  findFriendLinkRecordByNormalizedUrl,
  readAdminFriendLinkRecords,
  readNextFriendLinkSortOrder,
  updateFriendLinkRecord,
} from '../repositories/friend-link.repository';
import { ensureSeedPageSettings, readLinksPageSettings } from './page-settings.service';

const URL_PROTOCOLS = new Set(['http:', 'https:']);

type FriendLinkRecord = Awaited<ReturnType<typeof readAdminFriendLinkRecords>>[number];

function formatDateTime(value: Date) {
  return value.toISOString().slice(0, 16).replace('T', ' ');
}

function normalizeAbsoluteUrl(value: string, fieldLabel: string) {
  const trimmedValue = value.trim();

  try {
    const url = new URL(trimmedValue);
    if (!URL_PROTOCOLS.has(url.protocol)) {
      throw new Error('invalid-protocol');
    }

    url.hash = '';

    const normalizedValue = url.toString();
    if (normalizedValue.endsWith('/') && url.pathname === '/' && !url.search) {
      return normalizedValue.slice(0, -1);
    }

    return normalizedValue;
  }
  catch {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldLabel}必须是有效地址`,
    });
  }
}

function validateName(value: string) {
  const trimmedValue = value.trim();
  if (trimmedValue.length < 2 || trimmedValue.length > 40) {
    throw createError({
      statusCode: 400,
      statusMessage: '站点名称长度需在 2 到 40 个字符之间',
    });
  }

  return trimmedValue;
}

function validateDescription(value: string) {
  const trimmedValue = value.trim();
  if (trimmedValue.length < 1 || trimmedValue.length > 120) {
    throw createError({
      statusCode: 400,
      statusMessage: '站点描述长度需在 1 到 120 个字符之间',
    });
  }

  return trimmedValue;
}

function validateContact(value: string | undefined, required: boolean) {
  const trimmedValue = value?.trim() || '';

  if (!trimmedValue) {
    if (required) {
      throw createError({
        statusCode: 400,
        statusMessage: '联系方式长度需在 2 到 80 个字符之间',
      });
    }

    return null;
  }

  if (trimmedValue.length < 2 || trimmedValue.length > 80) {
    throw createError({
      statusCode: 400,
      statusMessage: '联系方式长度需在 2 到 80 个字符之间',
    });
  }

  return trimmedValue;
}

function validateStatus(status: FriendLinkRecordStatus) {
  if (status === 'visible' || status === 'hidden' || status === 'pending') {
    return status;
  }

  throw createError({
    statusCode: 400,
    statusMessage: '友链状态无效',
  });
}

function createAdminFriendLinkItem(record: FriendLinkRecord): AdminFriendLinkItem {
  return {
    id: record.id,
    name: record.name,
    url: record.url,
    avatarUrl: record.avatarUrl,
    contact: record.contact ?? '',
    description: record.description,
    status: record.status,
    submittedAt: formatDateTime(record.createdAt),
    updatedAt: formatDateTime(record.updatedAt),
  };
}

async function assertUniqueFriendLinkUrl(url: string, currentId?: string) {
  const existingRecord = await findFriendLinkRecordByNormalizedUrl(url);
  if (!existingRecord) {
    return;
  }

  if (currentId && existingRecord.id === currentId) {
    return;
  }

  throw createError({
    statusCode: 409,
    statusMessage: '该站点链接已存在，不能重复提交',
  });
}

function normalizeFriendLinkSaveInput(input: AdminFriendLinkSaveInput, requireContact: boolean) {
  return {
    name: validateName(input.name),
    url: normalizeAbsoluteUrl(input.url, '站点链接'),
    avatarUrl: normalizeAbsoluteUrl(input.avatarUrl, '头像链接'),
    contact: validateContact(input.contact, requireContact),
    description: validateDescription(input.description),
    status: validateStatus(input.status),
  };
}

export async function createFriendLinkApplication(input: FriendLinkApplicationSubmitInput) {
  await ensureSeedPageSettings();

  const linksPageSettings = await readLinksPageSettings();
  if (!linksPageSettings.enabled) {
    throw createError({
      statusCode: 409,
      statusMessage: '友情链接当前未开放申请',
    });
  }

  const normalizedInput = normalizeFriendLinkSaveInput({
    ...input,
    status: 'pending',
  }, true);

  await assertUniqueFriendLinkUrl(normalizedInput.url);

  await createFriendLinkRecord({
    id: `friend-link-${crypto.randomUUID()}`,
    name: normalizedInput.name,
    url: normalizedInput.url,
    avatarUrl: normalizedInput.avatarUrl,
    contact: normalizedInput.contact,
    description: normalizedInput.description,
    status: 'pending',
    sortOrder: await readNextFriendLinkSortOrder(),
    createdAt: new Date(),
  });

  return {
    ok: true,
    message: '友链申请已提交，等待审核',
  };
}

export async function readAdminFriendLinks() {
  await ensureSeedPageSettings();
  const records = await readAdminFriendLinkRecords();

  return records.map(createAdminFriendLinkItem);
}

export async function createAdminFriendLink(input: AdminFriendLinkSaveInput) {
  await ensureSeedPageSettings();

  const normalizedInput = normalizeFriendLinkSaveInput(input, false);
  await assertUniqueFriendLinkUrl(normalizedInput.url);

  const record = await createFriendLinkRecord({
    id: `friend-link-${crypto.randomUUID()}`,
    name: normalizedInput.name,
    url: normalizedInput.url,
    avatarUrl: normalizedInput.avatarUrl,
    contact: normalizedInput.contact,
    description: normalizedInput.description,
    status: normalizedInput.status,
    sortOrder: await readNextFriendLinkSortOrder(),
    createdAt: new Date(),
  });

  return createAdminFriendLinkItem(record);
}

export async function updateAdminFriendLink(id: string, input: AdminFriendLinkSaveInput) {
  await ensureSeedPageSettings();

  if (!id.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: '友链标识不能为空',
    });
  }

  const existingRecord = await findFriendLinkRecordById(id);
  if (!existingRecord) {
    throw createError({
      statusCode: 404,
      statusMessage: '友链不存在',
    });
  }

  const normalizedInput = normalizeFriendLinkSaveInput(input, false);
  await assertUniqueFriendLinkUrl(normalizedInput.url, id);

  const record = await updateFriendLinkRecord(id, normalizedInput);
  return createAdminFriendLinkItem(record);
}

export async function deleteAdminFriendLink(id: string) {
  await ensureSeedPageSettings();

  if (!id.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: '友链标识不能为空',
    });
  }

  const existingRecord = await findFriendLinkRecordById(id);
  if (!existingRecord) {
    throw createError({
      statusCode: 404,
      statusMessage: '友链不存在',
    });
  }

  await deleteFriendLinkRecord(id);

  return {
    ok: true,
  };
}

import type { H3Event } from 'h3';
import type {
  AdminMediaAssetBatchDeleteInput,
  AdminMediaAssetBatchMoveInput,
  AdminMediaAssetBatchTagInput,
  AdminMediaAssetRenameInput,
  AdminMediaFolderCreateInput,
  AdminMediaFolderRenameInput,
} from '../../shared/types/media';
import {
  createAdminMediaFolder,
  deleteAdminMediaAssets,
  deleteAdminMediaFolder,
  moveAdminMediaAssets,
  readAdminMediaAssets,
  readAdminMediaFileContent,
  readAdminMediaFolders,
  readAdminMediaTags,
  renameAdminMediaAsset,
  renameAdminMediaFolder,
  replaceAdminMediaAsset,
  updateAdminMediaAssetTags,
  uploadAdminMediaAssets,
} from '../services/media.service';
import { buildMediaResponseHeaders } from '../services/media-security.service';
import { requireAdminSession } from '../utils/require-admin-session';

function normalizeMultipartFile(part: NonNullable<Awaited<ReturnType<typeof readMultipartFormData>>>[number]) {
  const filename = (part.filename || '').trim();
  if (!filename || !part.data) {
    return null;
  }

  return {
    filename,
    mimeType: (part.type || '').trim(),
    data: Buffer.from(part.data),
  };
}

async function readUploadInput(event: H3Event) {
  const parts = await readMultipartFormData(event);
  if (!parts || parts.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '请先选择上传文件',
    });
  }

  let folderId = '';
  const files: Array<{ filename: string; mimeType: string; data: Buffer }> = [];

  for (const part of parts) {
    if (part.filename) {
      const normalizedFile = normalizeMultipartFile(part);
      if (normalizedFile) {
        files.push(normalizedFile);
      }
      continue;
    }

    if (part.name === 'folderId') {
      folderId = Buffer.from(part.data).toString('utf8');
    }
  }

  if (files.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '请先选择上传文件',
    });
  }

  return {
    folderId,
    files,
  };
}

async function readReplaceInput(event: H3Event) {
  const parts = await readMultipartFormData(event);
  if (!parts || parts.length === 0) {
    return null;
  }

  for (const part of parts) {
    if (!part.filename) {
      continue;
    }

    const normalizedFile = normalizeMultipartFile(part);
    if (normalizedFile) {
      return normalizedFile;
    }
  }

  return null;
}

export const mediaController = {
  async getAdminMediaAssets(event: H3Event) {
    await requireAdminSession(event);
    return await readAdminMediaAssets();
  },
  async getAdminMediaFolders(event: H3Event) {
    await requireAdminSession(event);
    return await readAdminMediaFolders();
  },
  async getAdminMediaTags(event: H3Event) {
    await requireAdminSession(event);
    return await readAdminMediaTags();
  },
  async uploadAdminMediaAssets(event: H3Event) {
    await requireAdminSession(event);
    const input = await readUploadInput(event);
    return await uploadAdminMediaAssets(input);
  },
  async renameAdminMediaAsset(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    const body = await readBody<AdminMediaAssetRenameInput | null>(event);
    return await renameAdminMediaAsset(id, body);
  },
  async replaceAdminMediaAsset(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    const file = await readReplaceInput(event);
    return await replaceAdminMediaAsset(id, file);
  },
  async moveAdminMediaAssets(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<AdminMediaAssetBatchMoveInput | null>(event);
    return await moveAdminMediaAssets(body);
  },
  async updateAdminMediaAssetTags(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<AdminMediaAssetBatchTagInput | null>(event);
    return await updateAdminMediaAssetTags(body);
  },
  async deleteAdminMediaAssets(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<AdminMediaAssetBatchDeleteInput | null>(event);
    return await deleteAdminMediaAssets(body);
  },
  async createAdminMediaFolder(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<AdminMediaFolderCreateInput | null>(event);
    return await createAdminMediaFolder(body);
  },
  async renameAdminMediaFolder(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    const body = await readBody<AdminMediaFolderRenameInput | null>(event);
    return await renameAdminMediaFolder(id, body);
  },
  async deleteAdminMediaFolder(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    return await deleteAdminMediaFolder(id);
  },
  async getAdminMediaFile(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    const result = await readAdminMediaFileContent(id);
    const headers = buildMediaResponseHeaders({
      fileName: result.fileName,
      kind: result.kind,
      mimeType: result.mimeType,
      isPublic: false,
    });

    for (const [name, value] of Object.entries(headers)) {
      setHeader(event, name, value);
    }

    return result.data;
  },
  async getPublicMediaFile(event: H3Event) {
    const id = getRouterParam(event, 'id') || '';
    const result = await readAdminMediaFileContent(id);
    const headers = buildMediaResponseHeaders({
      fileName: result.fileName,
      kind: result.kind,
      mimeType: result.mimeType,
      isPublic: true,
    });

    for (const [name, value] of Object.entries(headers)) {
      setHeader(event, name, value);
    }

    return result.data;
  },
};

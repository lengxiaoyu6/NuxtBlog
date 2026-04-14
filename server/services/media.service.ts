import type { MediaAsset, MediaFolder, MediaTag } from '../../app/types/admin-media';
import type {
  AdminMediaAssetBatchDeleteInput,
  AdminMediaAssetBatchMoveInput,
  AdminMediaAssetBatchTagInput,
  AdminMediaAssetRenameInput,
  AdminMediaFolderCreateInput,
  AdminMediaFolderRenameInput,
} from '../../shared/types/media';
import {
  countMediaAssetRecordsByFolderId,
  countMediaChildFolderRecords,
  countMediaFolderRecords,
  createMediaAssetRecord,
  createMediaFolderRecord,
  createMediaTagRecords,
  deleteMediaAssetRecords,
  deleteMediaFolderRecord,
  findMediaAssetRecordById,
  findMediaFolderByName,
  findMediaFolderRecordById,
  findMediaTagRecordsByIds,
  moveMediaAssetRecords,
  readMaxMediaFolderSortOrder,
  readMediaAssetFolderIdRecords,
  readMediaAssetRecords,
  readMediaAssetRecordsByIds,
  readMediaFolderRecords,
  readMediaTagRecords,
  replaceMediaAssetTagRecords,
  updateMediaAssetFileRecord,
  updateMediaAssetNameRecord,
  updateMediaFolderNameRecord,
} from '../repositories/media.repository';
import {
  createMediaStorageKey,
  deleteMediaStorageFile,
  ensureMediaStorageDirectory,
  readMediaStorageFile,
  writeMediaStorageFile,
} from './media-storage.service';
import { formatDateTimeInShanghai } from './post.logic.mjs';

interface UploadedMediaFile {
  filename: string;
  mimeType: string;
  data: Buffer;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'zip'];
const DEFAULT_IMAGE_TAG_ID = 'tag-inline';
const DEFAULT_DOCUMENT_TAG_ID = 'tag-attachment';

const usageTypeToAppMap = {
  post_cover: 'post-cover',
  post_inline_image: 'post-inline-image',
  post_attachment: 'post-attachment',
  site_banner: 'site-banner',
} as const;

const usageTypeToDbMap = {
  'post-cover': 'post_cover',
  'post-inline-image': 'post_inline_image',
  'post-attachment': 'post_attachment',
  'site-banner': 'site_banner',
} as const;

const seedFolders = [
  { id: 'all-assets', name: '全部资源', parentId: null, sortOrder: 1 },
  { id: 'post-assets', name: '文章素材', parentId: null, sortOrder: 2 },
  { id: 'homepage-assets', name: '首页横幅', parentId: null, sortOrder: 3 },
  { id: 'download-assets', name: '下载附件', parentId: null, sortOrder: 4 },
] as const;

const seedTags = [
  { id: 'tag-cover', name: '封面图', color: 'blue', sortOrder: 1 },
  { id: 'tag-inline', name: '正文配图', color: 'emerald', sortOrder: 2 },
  { id: 'tag-attachment', name: '下载附件', color: 'amber', sortOrder: 3 },
  { id: 'tag-banner', name: '横幅', color: 'rose', sortOrder: 4 },
] as const;

const seedAssets = [
  {
    id: 'asset-hero-grid',
    name: 'nuxt-hero-grid.svg',
    kind: 'image',
    extension: 'svg',
    mimeType: 'image/svg+xml',
    folderId: 'homepage-assets',
    tagIds: ['tag-banner'],
    createdAt: '2026-04-04 10:18',
    usage: [
      { id: 'usage-hero-grid', type: 'site-banner', targetTitle: '首页 Hero', updatedAt: '2026-04-04 10:18' },
    ],
    content: createSeedImageSvg('Nuxt Hero Grid', '#0ea5e9'),
    width: 1600,
    height: 900,
  },
  {
    id: 'asset-cover-minimal',
    name: 'minimal-dashboard-cover.svg',
    kind: 'image',
    extension: 'svg',
    mimeType: 'image/svg+xml',
    folderId: 'post-assets',
    tagIds: ['tag-cover'],
    createdAt: '2026-04-03 14:20',
    usage: [
      { id: 'usage-cover-minimal', type: 'post-cover', targetTitle: '极简后台设计观察', updatedAt: '2026-04-03 14:20' },
    ],
    content: createSeedImageSvg('Minimal Dashboard Cover', '#2563eb'),
    width: 1600,
    height: 900,
  },
  {
    id: 'asset-inline-color',
    name: 'color-system-inline.svg',
    kind: 'image',
    extension: 'svg',
    mimeType: 'image/svg+xml',
    folderId: 'post-assets',
    tagIds: ['tag-inline'],
    createdAt: '2026-04-02 12:10',
    usage: [
      { id: 'usage-inline-color', type: 'post-inline-image', targetTitle: 'Tailwind 色彩体系拆解', updatedAt: '2026-04-02 12:10' },
      { id: 'usage-inline-color-2', type: 'post-inline-image', targetTitle: '组件视觉层次整理', updatedAt: '2026-04-05 08:55' },
    ],
    content: createSeedImageSvg('Color System Inline', '#14b8a6'),
    width: 1600,
    height: 900,
  },
  {
    id: 'asset-avatar-kit',
    name: 'author-avatar-kit.svg',
    kind: 'image',
    extension: 'svg',
    mimeType: 'image/svg+xml',
    folderId: 'all-assets',
    tagIds: ['tag-inline'],
    createdAt: '2026-03-28 09:32',
    usage: [],
    content: createSeedImageSvg('Author Avatar Kit', '#475569'),
    width: 1600,
    height: 900,
  },
  {
    id: 'asset-pdf-kit',
    name: 'design-system-handbook.pdf',
    kind: 'document',
    extension: 'pdf',
    mimeType: 'application/pdf',
    folderId: 'download-assets',
    tagIds: ['tag-attachment'],
    createdAt: '2026-04-01 16:00',
    usage: [
      { id: 'usage-pdf-kit', type: 'post-attachment', targetTitle: '设计系统文档下载', updatedAt: '2026-04-01 16:00' },
    ],
    content: Buffer.from('%PDF-1.4\n% Demo handbook placeholder\n', 'utf8'),
  },
  {
    id: 'asset-doc-checklist',
    name: 'editor-review-checklist.docx',
    kind: 'document',
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    folderId: 'download-assets',
    tagIds: ['tag-attachment'],
    createdAt: '2026-03-31 11:42',
    usage: [],
    content: Buffer.from('Editor checklist placeholder', 'utf8'),
  },
  {
    id: 'asset-zip-kit',
    name: 'brand-assets.zip',
    kind: 'document',
    extension: 'zip',
    mimeType: 'application/zip',
    folderId: 'download-assets',
    tagIds: ['tag-attachment'],
    createdAt: '2026-03-29 17:25',
    usage: [
      { id: 'usage-zip-kit', type: 'post-attachment', targetTitle: '品牌素材打包', updatedAt: '2026-03-29 17:25' },
    ],
    content: Buffer.from('PK\u0003\u0004 demo zip placeholder', 'utf8'),
  },
] as const;

function createSeedImageSvg(title: string, color: string) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="${color}"/><text x="80" y="480" fill="#ffffff" font-size="72" font-family="Arial, sans-serif">${title}</text></svg>`,
    'utf8'
  );
}

function parseSeedDateTime(value: string) {
  return new Date(`${value.replace(' ', 'T')}:00+08:00`);
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function extractExtension(filename: string) {
  return filename.split('.').pop()?.trim().toLowerCase() ?? '';
}

function detectKind(filename: string, mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return 'image' as const;
  }

  const extension = extractExtension(filename);
  if (ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return 'image' as const;
  }

  return 'document' as const;
}

function validateUploadFile(file: UploadedMediaFile) {
  const extension = extractExtension(file.filename);
  const kind = detectKind(file.filename, file.mimeType);

  if (kind === 'image' && file.data.length > MAX_IMAGE_SIZE) {
    throw createError({ statusCode: 400, statusMessage: '图片大小不能超过 10 MB' });
  }

  if (kind === 'document' && file.data.length > MAX_DOCUMENT_SIZE) {
    throw createError({ statusCode: 400, statusMessage: '文档大小不能超过 10 MB' });
  }

  if (kind === 'image' && !ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    throw createError({ statusCode: 400, statusMessage: '当前图片格式暂不支持' });
  }

  if (kind === 'document' && !ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)) {
    throw createError({ statusCode: 400, statusMessage: '当前文档格式暂不支持' });
  }

  return {
    kind,
    extension,
  };
}

function toMediaTag(record: Awaited<ReturnType<typeof readMediaTagRecords>>[number]): MediaTag {
  return {
    id: record.id,
    name: record.name,
    color: record.color,
  };
}

function toMediaAsset(record: Awaited<ReturnType<typeof readMediaAssetRecords>>[number]): MediaAsset {
  const fileUrl = `/api/admin/media/files/${record.id}`;
  const sortedTagIds = [...record.tags]
    .sort((left, right) => left.tag.sortOrder - right.tag.sortOrder)
    .map((item) => item.tagId);

  return {
    id: record.id,
    name: record.name,
    kind: record.kind,
    extension: record.extension,
    mimeType: record.mimeType,
    size: record.size,
    width: record.width ?? undefined,
    height: record.height ?? undefined,
    previewUrl: record.kind === 'image' ? fileUrl : undefined,
    downloadUrl: fileUrl,
    folderId: record.folderId,
    tagIds: sortedTagIds,
    usage: record.usage.map((item) => ({
      id: item.id,
      type: usageTypeToAppMap[item.type],
      targetId: item.targetId,
      targetTitle: item.targetTitle,
      updatedAt: formatDateTimeInShanghai(item.updatedAt),
    })),
    createdAt: formatDateTimeInShanghai(record.createdAt),
    updatedAt: formatDateTimeInShanghai(record.updatedAt),
    status: record.status,
  };
}

function toMediaFolder(
  record: Awaited<ReturnType<typeof readMediaFolderRecords>>[number],
  totalAssetCount: number,
  assetCountMap: Map<string, number>,
  childrenCountMap: Map<string, number>,
): MediaFolder {
  if (record.id === 'all-assets') {
    return {
      id: record.id,
      name: record.name,
      parentId: record.parentId,
      assetCount: totalAssetCount,
      childrenCount: childrenCountMap.get(record.id) ?? 0,
    };
  }

  return {
    id: record.id,
    name: record.name,
    parentId: record.parentId,
    assetCount: assetCountMap.get(record.id) ?? 0,
    childrenCount: childrenCountMap.get(record.id) ?? 0,
  };
}

async function ensureWritableFolderId(folderId: string) {
  const normalizedFolderId = normalizeText(folderId) || 'post-assets';
  const preferredFolderId = normalizedFolderId === 'all-assets' ? 'post-assets' : normalizedFolderId;
  const preferredFolder = await findMediaFolderRecordById(preferredFolderId);
  if (preferredFolder) {
    return preferredFolder.id;
  }

  const fallbackFolder = await findMediaFolderRecordById('all-assets');
  if (!fallbackFolder) {
    throw createError({ statusCode: 500, statusMessage: '媒体目录初始化失败' });
  }

  return fallbackFolder.id;
}

async function ensureTagIdsExist(tagIds: string[]) {
  if (tagIds.length === 0) {
    return;
  }

  const tagRecords = await findMediaTagRecordsByIds(tagIds);
  if (tagRecords.length !== new Set(tagIds).size) {
    throw createError({
      statusCode: 400,
      statusMessage: '标签不存在或已失效',
    });
  }
}

export async function ensureSeedMediaLibrary() {
  const folderCount = await countMediaFolderRecords();
  if (folderCount > 0) {
    return;
  }

  await ensureMediaStorageDirectory();

  for (const folder of seedFolders) {
    await createMediaFolderRecord({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      sortOrder: folder.sortOrder,
    });
  }

  await createMediaTagRecords(seedTags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    sortOrder: tag.sortOrder,
  })));

  for (const asset of seedAssets) {
    const storageKey = `seed/${asset.id}.${asset.extension}`;
    await writeMediaStorageFile(storageKey, asset.content);

    const createdAt = parseSeedDateTime(asset.createdAt);
    await createMediaAssetRecord({
      id: asset.id,
      name: asset.name,
      originalName: asset.name,
      kind: asset.kind,
      extension: asset.extension,
      mimeType: asset.mimeType,
      size: asset.content.length,
      width: asset.kind === 'image' ? asset.width : undefined,
      height: asset.kind === 'image' ? asset.height : undefined,
      storageKey,
      folderId: asset.folderId,
      status: 'ready',
      createdAt,
      updatedAt: createdAt,
      tagIds: [...asset.tagIds],
      usage: asset.usage.map((item) => ({
        id: item.id,
        type: usageTypeToDbMap[item.type],
        targetId: `${item.id}-target`,
        targetTitle: item.targetTitle,
        updatedAt: parseSeedDateTime(item.updatedAt),
      })),
    });
  }
}

export async function readAdminMediaAssets() {
  await ensureSeedMediaLibrary();
  const records = await readMediaAssetRecords();
  return records.map(toMediaAsset);
}

export async function readAdminMediaFolders() {
  await ensureSeedMediaLibrary();
  const [folderRecords, folderIdRecords] = await Promise.all([
    readMediaFolderRecords(),
    readMediaAssetFolderIdRecords(),
  ]);
  const totalAssetCount = folderIdRecords.length;
  const assetCountMap = new Map<string, number>();
  for (const record of folderIdRecords) {
    assetCountMap.set(record.folderId, (assetCountMap.get(record.folderId) ?? 0) + 1);
  }

  const childrenCountMap = new Map<string, number>();
  for (const folder of folderRecords) {
    if (!folder.parentId) {
      continue;
    }

    childrenCountMap.set(folder.parentId, (childrenCountMap.get(folder.parentId) ?? 0) + 1);
  }

  if (!childrenCountMap.has('all-assets')) {
    childrenCountMap.set(
      'all-assets',
      folderRecords.filter((folder) => folder.id !== 'all-assets' && folder.parentId === null).length
    );
  }

  return folderRecords.map((record) => toMediaFolder(record, totalAssetCount, assetCountMap, childrenCountMap));
}

export async function readAdminMediaTags() {
  await ensureSeedMediaLibrary();
  const records = await readMediaTagRecords();
  return records.map(toMediaTag);
}

export async function uploadAdminMediaAssets(input: {
  folderId: string;
  files: UploadedMediaFile[];
}) {
  await ensureSeedMediaLibrary();

  if (input.files.length === 0) {
    return [] as MediaAsset[];
  }

  const folderId = await ensureWritableFolderId(input.folderId);
  const createdAssets: MediaAsset[] = [];

  for (const file of input.files) {
    const { kind, extension } = validateUploadFile(file);
    const storageKey = createMediaStorageKey(extension);
    const defaultTagId = kind === 'image' ? DEFAULT_IMAGE_TAG_ID : DEFAULT_DOCUMENT_TAG_ID;
    const tagIds = (await findMediaTagRecordsByIds([defaultTagId])).length > 0 ? [defaultTagId] : [];
    await writeMediaStorageFile(storageKey, file.data);

    try {
      const savedRecord = await createMediaAssetRecord({
        name: file.filename,
        originalName: file.filename,
        kind,
        extension,
        mimeType: file.mimeType || 'application/octet-stream',
        size: file.data.length,
        width: kind === 'image' ? 1600 : undefined,
        height: kind === 'image' ? 900 : undefined,
        storageKey,
        folderId,
        status: 'ready',
        tagIds,
        usage: [],
      });
      createdAssets.push(toMediaAsset(savedRecord));
    }
    catch (error) {
      await deleteMediaStorageFile(storageKey);
      throw error;
    }
  }

  return createdAssets;
}

export async function renameAdminMediaAsset(id: string, input: AdminMediaAssetRenameInput | null | undefined) {
  await ensureSeedMediaLibrary();
  const normalizedId = normalizeText(id);
  const name = normalizeText(input?.name);

  if (!normalizedId) {
    throw createError({ statusCode: 400, statusMessage: '资源标识不能为空' });
  }

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: '资源名称不能为空' });
  }

  const existingRecord = await findMediaAssetRecordById(normalizedId);
  if (!existingRecord) {
    throw createError({ statusCode: 404, statusMessage: '资源不存在' });
  }

  const savedRecord = await updateMediaAssetNameRecord(normalizedId, name);
  return {
    assetId: savedRecord.id,
    name: savedRecord.name,
  };
}

export async function replaceAdminMediaAsset(id: string, file: UploadedMediaFile | null) {
  await ensureSeedMediaLibrary();
  const normalizedId = normalizeText(id);
  if (!normalizedId) {
    throw createError({ statusCode: 400, statusMessage: '资源标识不能为空' });
  }

  if (!file) {
    throw createError({ statusCode: 400, statusMessage: '请先选择文件后再替换' });
  }

  const existingRecord = await findMediaAssetRecordById(normalizedId);
  if (!existingRecord) {
    throw createError({ statusCode: 404, statusMessage: '资源不存在' });
  }

  const { kind, extension } = validateUploadFile(file);
  if (kind !== existingRecord.kind) {
    throw createError({ statusCode: 400, statusMessage: '替换文件类型与当前资源不一致' });
  }

  const nextStorageKey = createMediaStorageKey(extension);
  await writeMediaStorageFile(nextStorageKey, file.data);

  try {
    const savedRecord = await updateMediaAssetFileRecord(normalizedId, {
      name: file.filename,
      originalName: file.filename,
      extension,
      mimeType: file.mimeType || 'application/octet-stream',
      size: file.data.length,
      width: kind === 'image' ? (existingRecord.width ?? 1600) : undefined,
      height: kind === 'image' ? (existingRecord.height ?? 900) : undefined,
      storageKey: nextStorageKey,
      status: 'ready',
    });

    await deleteMediaStorageFile(existingRecord.storageKey);
    return toMediaAsset(savedRecord);
  }
  catch (error) {
    await deleteMediaStorageFile(nextStorageKey);
    throw error;
  }
}

export async function moveAdminMediaAssets(input: AdminMediaAssetBatchMoveInput | null | undefined) {
  await ensureSeedMediaLibrary();
  const assetIds = Array.from(new Set(input?.assetIds ?? [])).map((item) => normalizeText(item)).filter(Boolean);
  if (assetIds.length === 0) {
    return { assetIds: [], folderId: '' };
  }

  const folderId = await ensureWritableFolderId(input?.folderId ?? '');
  await moveMediaAssetRecords(assetIds, folderId);
  return { assetIds, folderId };
}

export async function updateAdminMediaAssetTags(input: AdminMediaAssetBatchTagInput | null | undefined) {
  await ensureSeedMediaLibrary();
  const assetIds = Array.from(new Set(input?.assetIds ?? [])).map((item) => normalizeText(item)).filter(Boolean);
  const tagIds = Array.from(new Set(input?.tagIds ?? [])).map((item) => normalizeText(item)).filter(Boolean);

  if (assetIds.length === 0) {
    return { assetIds: [], tagIds };
  }

  await ensureTagIdsExist(tagIds);
  await replaceMediaAssetTagRecords(assetIds, tagIds);
  return { assetIds, tagIds };
}

export async function deleteAdminMediaAssets(input: AdminMediaAssetBatchDeleteInput | null | undefined) {
  await ensureSeedMediaLibrary();
  const assetIds = Array.from(new Set(input?.assetIds ?? [])).map((item) => normalizeText(item)).filter(Boolean);
  if (assetIds.length === 0) {
    return { assetIds: [] };
  }

  const records = await readMediaAssetRecordsByIds(assetIds);
  await deleteMediaAssetRecords(assetIds);
  await Promise.all(records.map((record) => deleteMediaStorageFile(record.storageKey)));

  return {
    assetIds: records.map((record) => record.id),
  };
}

export async function createAdminMediaFolder(input: AdminMediaFolderCreateInput | null | undefined) {
  await ensureSeedMediaLibrary();
  const name = normalizeText(input?.name);
  const parentId = normalizeText(input?.parentId ?? '') || null;

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: '文件夹名称不能为空' });
  }

  if (parentId) {
    const parentFolder = await findMediaFolderRecordById(parentId);
    if (!parentFolder) {
      throw createError({ statusCode: 404, statusMessage: '父级文件夹不存在' });
    }
  }

  const duplicateFolder = await findMediaFolderByName(name, parentId);
  if (duplicateFolder) {
    throw createError({ statusCode: 409, statusMessage: '同级目录中已存在同名文件夹' });
  }

  const sortOrder = (await readMaxMediaFolderSortOrder()) + 1;
  const savedFolder = await createMediaFolderRecord({
    name,
    parentId,
    sortOrder,
  });

  return {
    id: savedFolder.id,
    name: savedFolder.name,
    parentId: savedFolder.parentId,
    assetCount: 0,
    childrenCount: 0,
  } satisfies MediaFolder;
}

export async function renameAdminMediaFolder(id: string, input: AdminMediaFolderRenameInput | null | undefined) {
  await ensureSeedMediaLibrary();
  const normalizedId = normalizeText(id);
  const name = normalizeText(input?.name);

  if (!normalizedId) {
    throw createError({ statusCode: 400, statusMessage: '文件夹标识不能为空' });
  }

  if (normalizedId === 'all-assets') {
    throw createError({ statusCode: 400, statusMessage: '当前目录暂不支持重命名' });
  }

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: '文件夹名称不能为空' });
  }

  const existingFolder = await findMediaFolderRecordById(normalizedId);
  if (!existingFolder) {
    throw createError({ statusCode: 404, statusMessage: '文件夹不存在' });
  }

  const duplicateFolder = await findMediaFolderByName(name, existingFolder.parentId, normalizedId);
  if (duplicateFolder) {
    throw createError({ statusCode: 409, statusMessage: '同级目录中已存在同名文件夹' });
  }

  const savedFolder = await updateMediaFolderNameRecord(normalizedId, name);
  return {
    folderId: savedFolder.id,
    name: savedFolder.name,
  };
}

export async function deleteAdminMediaFolder(id: string) {
  await ensureSeedMediaLibrary();
  const normalizedId = normalizeText(id);

  if (!normalizedId) {
    throw createError({ statusCode: 400, statusMessage: '文件夹标识不能为空' });
  }

  if (normalizedId === 'all-assets') {
    throw createError({ statusCode: 400, statusMessage: '当前目录暂不支持删除' });
  }

  const existingFolder = await findMediaFolderRecordById(normalizedId);
  if (!existingFolder) {
    throw createError({ statusCode: 404, statusMessage: '文件夹不存在' });
  }

  const [childCount, assetCount] = await Promise.all([
    countMediaChildFolderRecords(normalizedId),
    countMediaAssetRecordsByFolderId(normalizedId),
  ]);

  if (childCount > 0 || assetCount > 0) {
    throw createError({ statusCode: 400, statusMessage: '请先清空目录中的资源与子目录' });
  }

  await deleteMediaFolderRecord(normalizedId);
  return {
    folderId: normalizedId,
  };
}

export async function readAdminMediaFileContent(id: string) {
  await ensureSeedMediaLibrary();
  const normalizedId = normalizeText(id);
  if (!normalizedId) {
    throw createError({ statusCode: 400, statusMessage: '资源标识不能为空' });
  }

  const record = await findMediaAssetRecordById(normalizedId);
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: '资源不存在' });
  }

  let data: Buffer;
  try {
    data = await readMediaStorageFile(record.storageKey);
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw createError({ statusCode: 404, statusMessage: '媒体文件不存在' });
    }

    throw error;
  }

  return {
    fileName: record.name,
    mimeType: record.mimeType,
    kind: record.kind,
    data,
  };
}

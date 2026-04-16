import { createError } from 'h3';
import { unzipSync } from 'fflate';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

export type TrustedMediaKind = 'image' | 'document';

export interface UploadedMediaBinary {
  filename: string;
  mimeType: string;
  data: Buffer;
}

export interface NormalizedMediaBinary {
  fileName: string;
  kind: TrustedMediaKind;
  extension: string;
  mimeType: string;
  data: Buffer;
  width?: number;
  height?: number;
}

export interface StoredMediaValidationInput {
  fileName: string;
  kind: TrustedMediaKind;
  data: Buffer;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif']);
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(['pdf', 'docx', 'zip']);
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/avif',
]);

const PDF_MIME_TYPE = 'application/pdf';
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const ZIP_MIME_TYPE = 'application/zip';
const DOCX_REQUIRED_ENTRY_NAMES = ['[Content_Types].xml', '_rels/.rels', 'word/document.xml'] as const;

function extractExtension(fileName: string) {
  return fileName.split('.').pop()?.trim().toLowerCase() ?? '';
}

function replaceFileExtension(fileName: string, extension: string) {
  const trimmedFileName = fileName.trim();
  const nextExtension = extension.toLowerCase();

  if (!trimmedFileName) {
    return `upload.${nextExtension}`;
  }

  const lastDotIndex = trimmedFileName.lastIndexOf('.');
  if (lastDotIndex <= 0) {
    return `${trimmedFileName}.${nextExtension}`;
  }

  return `${trimmedFileName.slice(0, lastDotIndex)}.${nextExtension}`;
}

function inferUploadKind(fileName: string, mimeType: string): TrustedMediaKind | null {
  const normalizedMimeType = mimeType.trim().toLowerCase();
  const extension = extractExtension(fileName);

  if (
    normalizedMimeType.startsWith('image/')
    || extension === 'svg'
    || ALLOWED_IMAGE_EXTENSIONS.has(extension)
  ) {
    return 'image';
  }

  if (
    ALLOWED_DOCUMENT_EXTENSIONS.has(extension)
    || normalizedMimeType === PDF_MIME_TYPE
    || normalizedMimeType === DOCX_MIME_TYPE
    || normalizedMimeType === ZIP_MIME_TYPE
  ) {
    return 'document';
  }

  return null;
}

function looksLikeSvg(data: Buffer) {
  const sample = data.subarray(0, 2048).toString('utf8').trimStart().toLowerCase();
  return sample.startsWith('<svg')
    || sample.startsWith('<?xml')
    || sample.includes('<svg');
}

function isValidDocxArchive(data: Buffer) {
  try {
    const entryMap = unzipSync(new Uint8Array(data), {
      filter(file) {
        return DOCX_REQUIRED_ENTRY_NAMES.includes(file.name as typeof DOCX_REQUIRED_ENTRY_NAMES[number]);
      },
    });

    return DOCX_REQUIRED_ENTRY_NAMES.every((entryName) => entryName in entryMap);
  }
  catch {
    return false;
  }
}

async function detectBinaryType(data: Buffer) {
  if (looksLikeSvg(data)) {
    return {
      kind: 'svg' as const,
      extension: 'svg',
      mimeType: 'image/svg+xml',
    };
  }

  const detectedType = await fileTypeFromBuffer(data);
  if (!detectedType) {
    return null;
  }

  if (ALLOWED_IMAGE_MIME_TYPES.has(detectedType.mime)) {
    return {
      kind: 'image' as const,
      extension: detectedType.ext === 'jpg' ? 'jpeg' : detectedType.ext,
      mimeType: detectedType.mime,
    };
  }

  if (detectedType.mime === PDF_MIME_TYPE) {
    return {
      kind: 'document' as const,
      extension: 'pdf',
      mimeType: PDF_MIME_TYPE,
    };
  }

  if (detectedType.mime === DOCX_MIME_TYPE || (detectedType.mime === ZIP_MIME_TYPE && isValidDocxArchive(data))) {
    return {
      kind: 'document' as const,
      extension: 'docx',
      mimeType: DOCX_MIME_TYPE,
    };
  }

  if (detectedType.mime === ZIP_MIME_TYPE) {
    return {
      kind: 'document' as const,
      extension: 'zip',
      mimeType: ZIP_MIME_TYPE,
    };
  }

  return null;
}

function createUnsupportedImageError() {
  return createError({
    statusCode: 400,
    statusMessage: '当前图片格式暂不支持',
  });
}

function createUnsupportedDocumentError() {
  return createError({
    statusCode: 400,
    statusMessage: '当前文档格式暂不支持',
  });
}

async function readImageMetadata(data: Buffer, mimeType: string) {
  const metadata = await sharp(data, mimeType === 'image/gif' ? { animated: true } : undefined).metadata();
  if (!metadata.width || !metadata.height) {
    throw createUnsupportedImageError();
  }

  return {
    width: metadata.width,
    height: metadata.height,
  };
}

export async function normalizeUploadedMediaFile(file: UploadedMediaBinary): Promise<NormalizedMediaBinary> {
  const requestedKind = inferUploadKind(file.filename, file.mimeType);
  if (!requestedKind) {
    throw createUnsupportedDocumentError();
  }

  if (requestedKind === 'image' && file.data.length > MAX_IMAGE_SIZE) {
    throw createError({ statusCode: 400, statusMessage: '图片大小不能超过 10 MB' });
  }

  if (requestedKind === 'document' && file.data.length > MAX_DOCUMENT_SIZE) {
    throw createError({ statusCode: 400, statusMessage: '文档大小不能超过 10 MB' });
  }

  const detectedBinaryType = await detectBinaryType(file.data);
  if (!detectedBinaryType) {
    throw requestedKind === 'image' ? createUnsupportedImageError() : createUnsupportedDocumentError();
  }

  if (requestedKind === 'image') {
    if (detectedBinaryType.kind !== 'image') {
      throw createUnsupportedImageError();
    }

    if (detectedBinaryType.mimeType === 'image/gif') {
      const { width, height } = await readImageMetadata(file.data, detectedBinaryType.mimeType);
      return {
        fileName: replaceFileExtension(file.filename, 'gif'),
        kind: 'image',
        extension: 'gif',
        mimeType: 'image/gif',
        data: file.data,
        width,
        height,
      };
    }

    const { data, info } = await sharp(file.data)
      .rotate()
      .png()
      .toBuffer({ resolveWithObject: true });

    return {
      fileName: replaceFileExtension(file.filename, 'png'),
      kind: 'image',
      extension: 'png',
      mimeType: 'image/png',
      data,
      width: info.width,
      height: info.height,
    };
  }

  const requestedExtension = extractExtension(file.filename);
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(requestedExtension)) {
    throw createUnsupportedDocumentError();
  }

  if (detectedBinaryType.kind !== 'document' || detectedBinaryType.extension !== requestedExtension) {
    throw createUnsupportedDocumentError();
  }

  return {
    fileName: replaceFileExtension(file.filename, requestedExtension),
    kind: 'document',
    extension: detectedBinaryType.extension,
    mimeType: detectedBinaryType.mimeType,
    data: file.data,
  };
}

export async function validateStoredMediaContent(input: StoredMediaValidationInput): Promise<NormalizedMediaBinary> {
  const detectedBinaryType = await detectBinaryType(input.data);
  if (!detectedBinaryType || detectedBinaryType.kind !== input.kind) {
    throw createError({
      statusCode: 400,
      statusMessage: '媒体文件校验失败',
    });
  }

  if (input.kind === 'image') {
    const { width, height } = await readImageMetadata(input.data, detectedBinaryType.mimeType);
    return {
      fileName: input.fileName,
      kind: 'image',
      extension: detectedBinaryType.extension,
      mimeType: detectedBinaryType.mimeType,
      data: input.data,
      width,
      height,
    };
  }

  return {
    fileName: input.fileName,
    kind: 'document',
    extension: detectedBinaryType.extension,
    mimeType: detectedBinaryType.mimeType,
    data: input.data,
  };
}

export function buildMediaResponseHeaders(input: {
  fileName: string;
  kind: TrustedMediaKind;
  mimeType: string;
  isPublic: boolean;
}) {
  const headers: Record<string, string> = {
    'Content-Type': input.mimeType || 'application/octet-stream',
    'Content-Disposition': `${input.kind === 'image' ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(input.fileName)}`,
  };

  if (input.isPublic) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }

  return headers;
}

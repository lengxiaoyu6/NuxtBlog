import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { usePrismaClient } from '../utils/prisma';

const mediaAssetInclude = {
  tags: {
    include: {
      tag: true,
    },
  },
  usage: {
    orderBy: [
      {
        updatedAt: 'desc',
      },
    ],
  },
} as const;

export type MediaAssetRecord = Prisma.MediaAssetGetPayload<{
  include: typeof mediaAssetInclude;
}>;

export type MediaFolderRecord = Awaited<ReturnType<typeof readMediaFolderRecords>>[number];
export type MediaTagRecord = Awaited<ReturnType<typeof readMediaTagRecords>>[number];

export async function countMediaFolderRecords() {
  return usePrismaClient().mediaFolder.count();
}

export async function readMediaFolderRecords() {
  return usePrismaClient().mediaFolder.findMany({
    orderBy: [
      {
        sortOrder: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  });
}

export async function readMediaTagRecords() {
  return usePrismaClient().mediaTag.findMany({
    orderBy: [
      {
        sortOrder: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  });
}

export async function readMediaAssetRecords() {
  return usePrismaClient().mediaAsset.findMany({
    include: mediaAssetInclude,
    orderBy: [
      {
        updatedAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
  });
}

export async function readMediaAssetFolderIdRecords() {
  return usePrismaClient().mediaAsset.findMany({
    select: {
      folderId: true,
    },
  });
}

export async function findMediaFolderRecordById(id: string) {
  return usePrismaClient().mediaFolder.findUnique({
    where: {
      id,
    },
  });
}

export async function findMediaTagRecordsByIds(ids: string[]) {
  return usePrismaClient().mediaTag.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });
}

export async function countMediaChildFolderRecords(parentId: string) {
  return usePrismaClient().mediaFolder.count({
    where: {
      parentId,
    },
  });
}

export async function countMediaAssetRecordsByFolderId(folderId: string) {
  return usePrismaClient().mediaAsset.count({
    where: {
      folderId,
    },
  });
}

export async function findMediaAssetRecordById(id: string) {
  return usePrismaClient().mediaAsset.findUnique({
    where: {
      id,
    },
    include: mediaAssetInclude,
  });
}

export async function readMediaAssetRecordsByIds(ids: string[]) {
  return usePrismaClient().mediaAsset.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    include: mediaAssetInclude,
  });
}

export async function createMediaFolderRecord(input: {
  id?: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
}) {
  return usePrismaClient().mediaFolder.create({
    data: {
      id: input.id,
      name: input.name,
      parentId: input.parentId,
      sortOrder: input.sortOrder,
    },
  });
}

export async function updateMediaFolderNameRecord(id: string, name: string) {
  return usePrismaClient().mediaFolder.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
}

export async function deleteMediaFolderRecord(id: string) {
  return usePrismaClient().mediaFolder.delete({
    where: {
      id,
    },
  });
}

export async function readMaxMediaFolderSortOrder() {
  const aggregate = await usePrismaClient().mediaFolder.aggregate({
    _max: {
      sortOrder: true,
    },
  });

  return aggregate._max.sortOrder ?? 0;
}

export async function createMediaAssetRecord(input: {
  id?: string;
  name: string;
  originalName: string;
  kind: Prisma.MediaAssetUncheckedCreateInput['kind'];
  extension: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  storageKey: string;
  folderId: string;
  status?: Prisma.MediaAssetUncheckedCreateInput['status'];
  createdAt?: Date;
  updatedAt?: Date;
  tagIds: string[];
  usage: Array<{
    id: string;
    type: Prisma.MediaAssetUsageUncheckedCreateInput['type'];
    targetId: string;
    targetTitle: string;
    updatedAt: Date;
  }>;
}) {
  return usePrismaClient().mediaAsset.create({
    data: {
      id: input.id,
      name: input.name,
      originalName: input.originalName,
      kind: input.kind,
      extension: input.extension,
      mimeType: input.mimeType,
      size: input.size,
      width: input.width,
      height: input.height,
      storageKey: input.storageKey,
      folderId: input.folderId,
      status: input.status ?? 'ready',
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      tags: input.tagIds.length > 0
        ? {
            create: input.tagIds.map((tagId) => ({
              tagId,
            })),
          }
        : undefined,
      usage: input.usage.length > 0
        ? {
            create: input.usage.map((item) => ({
              id: item.id,
              type: item.type,
              targetId: item.targetId,
              targetTitle: item.targetTitle,
              updatedAt: item.updatedAt,
            })),
          }
        : undefined,
    },
    include: mediaAssetInclude,
  });
}

export async function updateMediaAssetNameRecord(id: string, name: string) {
  return usePrismaClient().mediaAsset.update({
    where: {
      id,
    },
    data: {
      name,
    },
    include: mediaAssetInclude,
  });
}

export async function updateMediaAssetFileRecord(
  id: string,
  input: {
    name: string;
    originalName: string;
    extension: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    storageKey: string;
    status?: Prisma.MediaAssetUncheckedUpdateInput['status'];
  }
) {
  return usePrismaClient().mediaAsset.update({
    where: {
      id,
    },
    data: {
      name: input.name,
      originalName: input.originalName,
      extension: input.extension,
      mimeType: input.mimeType,
      size: input.size,
      width: input.width,
      height: input.height,
      storageKey: input.storageKey,
      status: input.status ?? 'ready',
    },
    include: mediaAssetInclude,
  });
}

export async function moveMediaAssetRecords(assetIds: string[], folderId: string) {
  return usePrismaClient().mediaAsset.updateMany({
    where: {
      id: {
        in: assetIds,
      },
    },
    data: {
      folderId,
    },
  });
}

export async function replaceMediaAssetTagRecords(assetIds: string[], tagIds: string[]) {
  const prisma = usePrismaClient();
  await prisma.$transaction(async (tx) => {
    await tx.mediaAssetTag.deleteMany({
      where: {
        assetId: {
          in: assetIds,
        },
      },
    });

    if (tagIds.length > 0) {
      await tx.mediaAssetTag.createMany({
        data: assetIds.flatMap((assetId) =>
          tagIds.map((tagId) => ({
            assetId,
            tagId,
          }))
        ),
        skipDuplicates: true,
      });
    }
  });
}

export async function deleteMediaAssetRecords(assetIds: string[]) {
  return usePrismaClient().mediaAsset.deleteMany({
    where: {
      id: {
        in: assetIds,
      },
    },
  });
}

export async function findMediaFolderByName(name: string, parentId: string | null, excludeId?: string) {
  return usePrismaClient().mediaFolder.findFirst({
    where: {
      name,
      parentId,
      id: excludeId
        ? {
            not: excludeId,
          }
        : undefined,
    },
  });
}

export async function createMediaTagRecords(records: Array<{ id: string; name: string; color: Prisma.MediaTagCreateManyInput['color']; sortOrder: number }>) {
  if (records.length === 0) {
    return;
  }

  await usePrismaClient().mediaTag.createMany({
    data: records,
    skipDuplicates: true,
  });
}

export async function readExistingMediaAssetIdRecords(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  return usePrismaClient().mediaAsset.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      id: true,
    },
  });
}

export async function replacePostMediaAssetUsageRecords(
  postId: string,
  postTitle: string,
  records: Array<{
    assetId: string;
    type: Prisma.MediaAssetUsageCreateManyInput['type'];
  }>
) {
  const prisma = usePrismaClient();
  await prisma.$transaction(async (tx) => {
    await tx.mediaAssetUsage.deleteMany({
      where: {
        targetId: postId,
        type: {
          in: ['post_cover', 'post_inline_image', 'post_attachment'],
        },
      },
    });

    if (records.length === 0) {
      return;
    }

    await tx.mediaAssetUsage.createMany({
      data: records.map((item) => ({
        id: randomUUID(),
        assetId: item.assetId,
        type: item.type,
        targetId: postId,
        targetTitle: postTitle,
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });
  });
}

export async function deletePostMediaAssetUsageRecords(postId: string) {
  return usePrismaClient().mediaAssetUsage.deleteMany({
    where: {
      targetId: postId,
      type: {
        in: ['post_cover', 'post_inline_image', 'post_attachment'],
      },
    },
  });
}

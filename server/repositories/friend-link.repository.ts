import { usePrismaClient } from '../utils/prisma';
import type { FriendLinkRecordStatus } from '../../shared/types/friend-link';

async function readLinksPageId() {
  const record = await usePrismaClient().managedPage.findUnique({
    where: {
      pageKey: 'links',
    },
    select: {
      linksPageSettings: {
        select: {
          managedPageId: true,
        },
      },
    },
  });

  const linksPageId = record?.linksPageSettings?.managedPageId;
  if (!linksPageId) {
    throw createError({
      statusCode: 500,
      statusMessage: '友情链接页面配置缺失',
    });
  }

  return linksPageId;
}

export async function readAdminFriendLinkRecords() {
  const linksPageId = await readLinksPageId();

  return usePrismaClient().friendLink.findMany({
    where: {
      linksPageId,
    },
    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        sortOrder: 'desc',
      },
    ],
  });
}

export async function findFriendLinkRecordById(id: string) {
  const linksPageId = await readLinksPageId();

  return usePrismaClient().friendLink.findFirst({
    where: {
      id,
      linksPageId,
    },
  });
}

export async function findFriendLinkRecordByNormalizedUrl(url: string) {
  const linksPageId = await readLinksPageId();

  return usePrismaClient().friendLink.findFirst({
    where: {
      linksPageId,
      url,
    },
  });
}

export async function readNextFriendLinkSortOrder() {
  const linksPageId = await readLinksPageId();
  const record = await usePrismaClient().friendLink.findFirst({
    where: {
      linksPageId,
    },
    orderBy: {
      sortOrder: 'desc',
    },
    select: {
      sortOrder: true,
    },
  });

  return (record?.sortOrder ?? 0) + 1;
}

export async function createFriendLinkRecord(input: {
  id: string;
  name: string;
  url: string;
  avatarUrl: string;
  contact: string | null;
  description: string;
  status: FriendLinkRecordStatus;
  sortOrder: number;
  createdAt?: Date;
}) {
  const linksPageId = await readLinksPageId();

  return usePrismaClient().friendLink.create({
    data: {
      id: input.id,
      linksPageId,
      name: input.name,
      url: input.url,
      avatarUrl: input.avatarUrl,
      contact: input.contact,
      description: input.description,
      status: input.status,
      sortOrder: input.sortOrder,
      createdAt: input.createdAt,
    },
  });
}

export async function updateFriendLinkRecord(id: string, input: {
  name: string;
  url: string;
  avatarUrl: string;
  contact: string | null;
  description: string;
  status: FriendLinkRecordStatus;
}) {
  return usePrismaClient().friendLink.update({
    where: {
      id,
    },
    data: {
      name: input.name,
      url: input.url,
      avatarUrl: input.avatarUrl,
      contact: input.contact,
      description: input.description,
      status: input.status,
    },
  });
}

export async function deleteFriendLinkRecord(id: string) {
  return usePrismaClient().friendLink.delete({
    where: {
      id,
    },
  });
}

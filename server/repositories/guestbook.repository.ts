import { usePrismaClient } from '../utils/prisma';

export async function readGuestbookEntryRecords() {
  return usePrismaClient().guestbookEntry.findMany({
    orderBy: [
      {
        submittedAt: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  });
}

export async function findGuestbookEntryRecordById(id: string) {
  return usePrismaClient().guestbookEntry.findUnique({
    where: {
      id,
    },
  });
}

export async function createGuestbookEntryRecord(input: {
  parentId: string | null;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl: string;
  authorRegion: string;
  content: string;
  submittedAt: Date;
}) {
  return usePrismaClient().guestbookEntry.create({
    data: {
      parentId: input.parentId,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      authorAvatarUrl: input.authorAvatarUrl,
      authorRegion: input.authorRegion,
      content: input.content,
      submittedAt: input.submittedAt,
    },
  });
}

export async function updateGuestbookEntryStatusRecord(id: string, status: 'approved' | 'rejected' | 'spam') {
  return usePrismaClient().guestbookEntry.update({
    where: {
      id,
    },
    data: {
      status,
      reviewedAt: new Date(),
    },
  });
}

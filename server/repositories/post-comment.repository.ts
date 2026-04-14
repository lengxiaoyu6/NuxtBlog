import type { Prisma } from '@prisma/client';
import type { PostCommentStatus } from '../../shared/types/post-comment';
import { usePrismaClient } from '../utils/prisma';

export interface ReadAdminPostCommentRecordOptions {
  status?: PostCommentStatus;
  postId?: number;
  keyword?: string;
}

const adminPostCommentInclude = {
  post: {
    select: {
      id: true,
      title: true,
    },
  },
  parent: {
    select: {
      id: true,
      authorName: true,
    },
  },
} as const;

export async function readPostCommentRecordsByPostId(postId: number) {
  return usePrismaClient().postComment.findMany({
    where: {
      postId,
    },
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

export async function findPostCommentRecordById(id: string) {
  return usePrismaClient().postComment.findUnique({
    where: {
      id,
    },
  });
}

export async function createPostCommentRecord(input: {
  postId: number;
  parentId: string | null;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl: string;
  authorRegion: string;
  content: string;
  submittedAt: Date;
}) {
  return usePrismaClient().postComment.create({
    data: {
      postId: input.postId,
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

export async function readAdminPostCommentRecords(options: ReadAdminPostCommentRecordOptions = {}) {
  const where: Prisma.PostCommentWhereInput = {};

  if (options.status) {
    where.status = options.status;
  }

  if (options.postId) {
    where.postId = options.postId;
  }

  if (options.keyword) {
    where.OR = [
      {
        content: {
          contains: options.keyword,
        },
      },
      {
        authorName: {
          contains: options.keyword,
        },
      },
      {
        authorEmail: {
          contains: options.keyword,
        },
      },
      {
        post: {
          title: {
            contains: options.keyword,
          },
        },
      },
    ];
  }

  return usePrismaClient().postComment.findMany({
    where,
    include: adminPostCommentInclude,
    orderBy: [
      {
        submittedAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
  });
}

export async function countPostCommentRecords() {
  return usePrismaClient().postComment.count();
}

export async function countPendingPostCommentRecords() {
  return usePrismaClient().postComment.count({
    where: {
      status: 'pending',
    },
  });
}

export async function updatePostCommentStatusRecord(id: string, status: PostCommentStatus) {
  return usePrismaClient().postComment.update({
    where: {
      id,
    },
    data: {
      status,
      reviewedAt: new Date(),
    },
    include: adminPostCommentInclude,
  });
}

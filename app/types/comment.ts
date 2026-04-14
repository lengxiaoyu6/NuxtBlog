import type { AdminCommentStatus } from '~/types/admin-comment';

export interface CommentItemData {
  id: string;
  author: string;
  avatar: string;
  date: string;
  submittedAt?: string;
  region?: string;
  content: string;
  likes: number;
  status?: AdminCommentStatus;
  replies?: CommentItemData[];
}

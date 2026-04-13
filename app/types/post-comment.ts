export type PostCommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface PublicPostCommentItem {
  id: string;
  parentId: string | null;
  authorName: string;
  authorAvatarUrl: string;
  authorRegion: string;
  content: string;
  submittedAt: string;
  replies: PublicPostCommentItem[];
}

export interface AdminPostCommentItem {
  id: string;
  postId: number;
  parentId: string | null;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl: string;
  authorRegion: string;
  content: string;
  status: PostCommentStatus;
  submittedAt: string;
  reviewedAt: string | null;
}

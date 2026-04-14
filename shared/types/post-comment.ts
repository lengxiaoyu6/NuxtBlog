export type PostCommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface PostCommentSubmitInput {
  parentId?: string;
  authorName: string;
  authorEmail: string;
  content: string;
}

export interface AdminPostCommentListQuery {
  status?: PostCommentStatus;
  postId?: string;
  keyword?: string;
}

export interface PostCommentStatusUpdateInput {
  status: 'approved' | 'rejected' | 'spam';
}

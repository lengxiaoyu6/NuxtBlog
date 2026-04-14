export type AdminCommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export type AdminCommentAction = 'approve' | 'reject' | 'mark-spam';

export interface AdminComment {
  id: string;
  status: AdminCommentStatus;
  content: string;
  articleId: string;
  articleTitle: string;
  authorName: string;
  authorRegion: string;
  submittedAt: string;
  replyToSummary?: string;
}

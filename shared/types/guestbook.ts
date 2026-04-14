export interface GuestbookEntrySubmitInput {
  parentId?: string;
  authorName: string;
  authorEmail: string;
  content: string;
}

export interface GuestbookStatusUpdateInput {
  status: 'approved' | 'rejected' | 'spam';
}

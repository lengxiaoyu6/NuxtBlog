import type { FriendLinkStatus } from '~/types/page-settings';

export interface AdminFriendLinkItem {
  id: string;
  name: string;
  url: string;
  avatarUrl: string;
  contact: string;
  description: string;
  status: FriendLinkStatus;
  submittedAt: string;
  updatedAt: string;
}

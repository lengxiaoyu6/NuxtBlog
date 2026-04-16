export type FriendLinkRecordStatus = 'visible' | 'hidden' | 'pending';

export interface FriendLinkApplicationSubmitInput {
  name: string;
  url: string;
  avatarUrl: string;
  contact: string;
  description: string;
  turnstileToken?: string;
}

export interface AdminFriendLinkSaveInput {
  name: string;
  url: string;
  avatarUrl: string;
  contact?: string;
  description: string;
  turnstileToken?: string;
  status: FriendLinkRecordStatus;
}

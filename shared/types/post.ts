export type BlogPostStatus = 'draft' | 'published';

export interface AdminPostUpsertInput {
  title: string;
  slug?: string;
  excerpt: string;
  contentMarkdown?: string;
  category: string;
  tags: string[];
  coverImageUrl?: string;
  status: BlogPostStatus;
  isPinned?: boolean;
}

export interface AdminPostBulkPublishInput {
  ids: number[];
}

export interface AdminPostListQuery {
  status?: BlogPostStatus;
  category?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface PublicPostListQuery {
  category?: string;
  page?: number;
  pageSize?: number;
}

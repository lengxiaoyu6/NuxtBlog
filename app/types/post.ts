export interface CategoryCountItem {
  name: string;
  count: number;
}

export interface AdminPostListItem {
  id: number;
  identifier: string;
  title: string;
  excerpt: string;
  category: string;
  commentsCount: number;
  likesCount: number;
  viewsCount: number;
  updatedAt: string;
  status: 'draft' | 'published';
  coverImageUrl: string | null;
}

export interface AdminPostDetail extends AdminPostListItem {
  tags: string[];
  slug: string | null;
  contentMarkdown: string;
  isPinned: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface AdminPostListResponse {
  items: AdminPostListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminDashboardStats {
  totalPosts: number;
  totalComments: number;
  totalViews: number;
  pendingComments: number;
}

export interface AdminDashboardRecentPostItem {
  id: number;
  title: string;
  updatedAt: string;
  status: 'draft' | 'published';
}

export interface AdminDashboardSummary {
  stats: AdminDashboardStats;
  recentPosts: AdminDashboardRecentPostItem[];
}

export interface PublicPostListItem {
  id: number;
  identifier: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImageUrl: string | null;
  publishedAt: string;
  readTimeText: string;
  isPinned: boolean;
  likesCount: number;
}

export interface PublicPostDetail extends PublicPostListItem {
  contentMarkdown: string;
  commentsCount: number;
  viewsCount: number;
}

export interface PublicPostNeighbor {
  id: number;
  identifier: string;
  title: string;
}

export interface PublicPostListResponse {
  items: PublicPostListItem[];
  total: number;
  page: number;
  pageSize: number;
  categories: CategoryCountItem[];
}

export interface PublicPostArchiveResponse {
  items: PublicPostListItem[];
  categories: CategoryCountItem[];
}

export interface PublicPostDetailResponse {
  post: PublicPostDetail;
  prevPost: PublicPostNeighbor | null;
  nextPost: PublicPostNeighbor | null;
}

export interface PublicPostInteractionResponse {
  viewsCount: number;
  likesCount: number;
}

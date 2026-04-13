import type { CategoryCountItem } from './post';

export interface PostSearchResultItem {
  id: number;
  identifier: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
}

export interface PopularPostInsightItem {
  id: number;
  identifier: string;
  title: string;
  viewsCount: number;
  likesCount: number;
}

export interface PostTagInsightItem {
  name: string;
  count: number;
}

export interface PostInsightStats {
  postCount: number;
  runningDays: number;
  lastActivity: string | null;
}

export interface PostInsightsResponse {
  categories: CategoryCountItem[];
  popularPosts: PopularPostInsightItem[];
  tags: PostTagInsightItem[];
  stats: PostInsightStats | null;
}

export interface RssFeedLinkItem {
  title: string;
  type: string;
  description: string;
  url: string;
}

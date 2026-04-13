import type { CategoryCountItem, PublicPostListItem } from '../../app/types/post';
import type { AdminPostUpsertInput } from '../../shared/types/post';

export interface NormalizedAdminPostInput {
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  category: string;
  tags: string[];
  coverImageUrl: string;
  status: string;
  isPinned: boolean;
}

export interface CategorySourceRecord {
  category: string;
  count?: number;
  _count?: {
    _all: number;
  };
}

export interface PublicPostListRecordShape {
  id: number;
  slug?: string | null;
  title: string;
  excerpt: string;
  category: string;
  tagsJson: unknown;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  readTimeText: string;
  isPinned: boolean;
  likesCount: number;
}

export function formatDateTimeInShanghai(value: Date): string;

export function formatDateInShanghai(value: Date): string;

export function estimateReadTimeText(markdown: string): string;

export function parseTags(value: unknown): string[];

export function normalizePostInput(input: Partial<AdminPostUpsertInput> | null | undefined): NormalizedAdminPostInput;

export function createCategoryItems(records: CategorySourceRecord[]): CategoryCountItem[];

export function resolvePostPublicIdentifier(record: Pick<PublicPostListRecordShape, 'id' | 'slug'>): string;

export function toPublicPostListItem(record: PublicPostListRecordShape): PublicPostListItem;

export function isUniqueConstraintErrorForField(error: unknown, fieldName: string): boolean;

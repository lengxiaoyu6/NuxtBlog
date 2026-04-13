export type MediaAssetKind = 'image' | 'document';
export type MediaAssetLifecycleStatus = 'ready' | 'uploading' | 'failed';
export type MediaViewMode = 'grid' | 'table';
export type MediaSortMode = 'newest' | 'oldest' | 'name';
export type MediaKindFilter = 'all' | MediaAssetKind;
export type MediaUploadStatus = 'queued' | 'uploading' | 'success' | 'failed';

export interface MediaAssetUsage {
  id: string;
  type: 'post-cover' | 'post-inline-image' | 'post-attachment' | 'site-banner';
  targetId: string;
  targetTitle: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  kind: MediaAssetKind;
  extension: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  previewUrl?: string;
  downloadUrl: string;
  folderId: string;
  tagIds: string[];
  usage: MediaAssetUsage[];
  createdAt: string;
  updatedAt: string;
  status: MediaAssetLifecycleStatus;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  assetCount: number;
  childrenCount: number;
}

export interface MediaTag {
  id: string;
  name: string;
  color: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose';
}

export interface MediaUploadTask {
  id: string;
  fileName: string;
  kind: MediaAssetKind;
  progress: number;
  status: MediaUploadStatus;
  folderId: string;
  errorMessage?: string;
  file?: File;
}

export interface MediaStat {
  id: 'all' | 'image' | 'document' | 'recent';
  label: string;
  value: string;
  hint: string;
}

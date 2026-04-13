export interface AdminMediaAssetBatchMoveInput {
  assetIds: string[];
  folderId: string;
}

export interface AdminMediaAssetBatchTagInput {
  assetIds: string[];
  tagIds: string[];
}

export interface AdminMediaAssetBatchDeleteInput {
  assetIds: string[];
}

export interface AdminMediaAssetRenameInput {
  name: string;
}

export interface AdminMediaFolderCreateInput {
  name: string;
  parentId?: string | null;
}

export interface AdminMediaFolderRenameInput {
  name: string;
}

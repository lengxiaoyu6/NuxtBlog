import type { MediaAsset, MediaFolder, MediaTag } from '~/types/admin-media';

export async function listAssets() {
  return await $fetch<MediaAsset[]>('/api/admin/media/assets');
}

export async function listFolders() {
  return await $fetch<MediaFolder[]>('/api/admin/media/folders');
}

export async function listTags() {
  return await $fetch<MediaTag[]>('/api/admin/media/tags');
}

export async function uploadAssets(files: File[], folderId: string) {
  const formData = new FormData();
  formData.set('folderId', folderId);
  for (const file of files) {
    formData.append('files', file, file.name);
  }

  return await $fetch<MediaAsset[]>('/api/admin/media/assets/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function renameAsset(assetId: string, name: string) {
  return await $fetch<{ assetId: string; name: string }>(`/api/admin/media/assets/${assetId}/name`, {
    method: 'PATCH',
    body: {
      name,
    },
  });
}

export async function replaceAsset(assetId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file, file.name);

  return await $fetch<MediaAsset>(`/api/admin/media/assets/${assetId}/replace`, {
    method: 'POST',
    body: formData,
  });
}

export async function moveAssets(assetIds: string[], folderId: string) {
  return await $fetch<{ assetIds: string[]; folderId: string }>('/api/admin/media/assets/batch/move', {
    method: 'PATCH',
    body: {
      assetIds,
      folderId,
    },
  });
}

export async function updateAssetTags(assetIds: string[], tagIds: string[]) {
  return await $fetch<{ assetIds: string[]; tagIds: string[] }>('/api/admin/media/assets/batch/tags', {
    method: 'PATCH',
    body: {
      assetIds,
      tagIds,
    },
  });
}

export async function deleteAssets(assetIds: string[]) {
  return await $fetch<{ assetIds: string[] }>('/api/admin/media/assets', {
    method: 'DELETE',
    body: {
      assetIds,
    },
  });
}

export async function createFolder(name: string, parentId: string | null) {
  return await $fetch<MediaFolder>('/api/admin/media/folders', {
    method: 'POST',
    body: {
      name,
      parentId,
    },
  });
}

export async function renameFolder(folderId: string, name: string) {
  return await $fetch<{ folderId: string; name: string }>(`/api/admin/media/folders/${folderId}`, {
    method: 'PATCH',
    body: {
      name,
    },
  });
}

export async function deleteFolder(folderId: string) {
  return await $fetch<{ folderId: string }>(`/api/admin/media/folders/${folderId}`, {
    method: 'DELETE',
  });
}

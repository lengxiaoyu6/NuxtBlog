import { computed, ref, watch } from 'vue';
import { useAppToast } from '~/composables/useAppToast';
import {
  createFolder,
  deleteFolder,
  deleteAssets,
  listAssets,
  listFolders,
  listTags,
  moveAssets,
  renameAsset,
  renameFolder,
  replaceAsset,
  updateAssetTags,
  uploadAssets,
} from '~/services/admin-media';
import type {
  MediaAsset,
  MediaFolder,
  MediaKindFilter,
  MediaSortMode,
  MediaStat,
  MediaTag,
  MediaUploadTask,
  MediaViewMode,
} from '~/types/admin-media';
import { resolveRequestErrorMessage } from '~/utils/request-error';

const maxImageSize = 10 * 1024 * 1024;
const maxDocumentSize = 10 * 1024 * 1024;
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif'];
const allowedDocumentExtensions = ['pdf', 'docx', 'zip'];
const imageAcceptValue = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif';
const documentAcceptValue = '.pdf,.docx,.zip,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip';

export function useAdminMediaLibrary() {
  const { addToast } = useAppToast();

  const searchQuery = ref('');
  const activeFolderId = ref('all-assets');
  const activeKind = ref<MediaKindFilter>('all');
  const selectedTagIds = ref<string[]>([]);
  const selectedAssetIds = ref<string[]>([]);
  const sortMode = ref<MediaSortMode>('newest');
  const viewMode = ref<MediaViewMode>('grid');
  const currentPage = ref(1);
  const pageSize = 15;
  const uploadTasks = ref<MediaUploadTask[]>([]);
  const assets = ref<MediaAsset[]>([]);
  const folders = ref<MediaFolder[]>([]);
  const tags = ref<MediaTag[]>([]);
  const activeAssetId = ref('');
  const previewAssetId = ref('');
  const isUploadPanelOpen = ref(false);
  const isPreviewOpen = ref(false);
  const isCreateFolderModalOpen = ref(false);
  const isRenameFolderModalOpen = ref(false);
  const isDeleteFolderModalOpen = ref(false);
  const newFolderName = ref('');
  const renameFolderName = ref('');
  const folderToRenameId = ref('');
  const folderToDeleteId = ref('');
  const hasHydrated = ref(false);

  const visibleFolders = computed(() => {
    return folders.value.map((folder) => {
      if (folder.id === 'all-assets') {
        return { ...folder, assetCount: assets.value.length };
      }

      const assetCount = assets.value.filter((asset) => asset.folderId === folder.id).length;
      const childrenCount = folders.value.filter((current) => current.parentId === folder.id).length;
      return { ...folder, assetCount, childrenCount };
    });
  });

  const activeAsset = computed(() => {
    return assets.value.find((asset) => asset.id === activeAssetId.value) ?? null;
  });

  const previewAsset = computed(() => {
    return assets.value.find((asset) => asset.id === previewAssetId.value) ?? null;
  });

  const filteredAssets = computed(() => {
    const keyword = searchQuery.value.trim().toLowerCase();
    const results = assets.value.filter((asset) => {
      const matchesFolder = activeFolderId.value === 'all-assets' || asset.folderId === activeFolderId.value;
      const matchesKind = activeKind.value === 'all' || asset.kind === activeKind.value;
      const matchesTags = selectedTagIds.value.length === 0 || selectedTagIds.value.every((tagId) => asset.tagIds.includes(tagId));
      const haystack = [asset.name, asset.extension, asset.mimeType].join(' ').toLowerCase();
      const matchesKeyword = keyword.length === 0 || haystack.includes(keyword);
      return matchesFolder && matchesKind && matchesTags && matchesKeyword;
    });

    return [...results].sort((left, right) => {
      if (sortMode.value === 'name') {
        return left.name.localeCompare(right.name, 'zh-CN');
      }

      return sortMode.value === 'newest'
        ? right.updatedAt.localeCompare(left.updatedAt)
        : left.updatedAt.localeCompare(right.updatedAt);
    });
  });

  const totalFilteredAssets = computed(() => filteredAssets.value.length);

  const paginatedAssets = computed(() => {
    const startIndex = (currentPage.value - 1) * pageSize;
    return filteredAssets.value.slice(startIndex, startIndex + pageSize);
  });

  const totalPageCount = computed(() => Math.max(1, Math.ceil(totalFilteredAssets.value / pageSize)));

  const stats = computed<MediaStat[]>(() => {
    const imageCount = assets.value.filter((asset) => asset.kind === 'image').length;
    const documentCount = assets.value.filter((asset) => asset.kind === 'document').length;
    const recentCount = assets.value.filter((asset) => asset.createdAt >= '2026-04-01').length;

    return [
      { id: 'all', label: '资源总数', value: String(assets.value.length), hint: '图片与文档合计' },
      { id: 'image', label: '图片数量', value: String(imageCount), hint: '封面与配图资源' },
      { id: 'document', label: '文档数量', value: String(documentCount), hint: '附件与资料下载' },
      { id: 'recent', label: '近期上传', value: String(recentCount), hint: '近五天新增资源' },
    ];
  });

  const isAllVisibleSelected = computed(() => {
    return paginatedAssets.value.length > 0 && paginatedAssets.value.every((asset) => selectedAssetIds.value.includes(asset.id));
  });

  const folderPendingRename = computed(() => {
    return folders.value.find((folder) => folder.id === folderToRenameId.value) ?? null;
  });

  const folderPendingDelete = computed(() => {
    return folders.value.find((folder) => folder.id === folderToDeleteId.value) ?? null;
  });

  function findUploadTask(taskId: string) {
    return uploadTasks.value.find((task) => task.id === taskId);
  }

  function resolveUploadFolderId(folderId: string) {
    return folderId === 'all-assets' ? 'post-assets' : folderId;
  }

  function readFileExtension(fileName: string) {
    return fileName.split('.').pop()?.trim().toLowerCase() ?? '';
  }

  function detectUploadKind(file: File): MediaAsset['kind'] | null {
    const extension = readFileExtension(file.name);

    if (file.type.startsWith('image/') || allowedImageExtensions.includes(extension)) {
      return 'image';
    }

    if (allowedDocumentExtensions.includes(extension)) {
      return 'document';
    }

    return null;
  }


  function validateUploadFile(file: File) {
    const extension = readFileExtension(file.name);
    const kind = detectUploadKind(file);

    if (!kind) {
      return '当前文件格式暂不支持，请选择真实图片二进制或 PDF、DOCX、ZIP 文档';
    }

    if (kind === 'image' && file.size > maxImageSize) {
      return '图片大小不能超过 10 MB';
    }

    if (kind === 'document' && file.size > maxDocumentSize) {
      return '文档大小不能超过 10 MB';
    }

    if (kind === 'image' && !allowedImageExtensions.includes(extension)) {
      return '当前图片格式暂不支持，请选择真实图片二进制文件';
    }

    if (kind === 'document' && !allowedDocumentExtensions.includes(extension)) {
      return '当前文档格式暂不支持，请选择 PDF、DOCX、ZIP 文档';
    }

    return '';
  }

  async function selectReplaceFile(kind: MediaAsset['kind']) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }

    return await new Promise<File | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = kind === 'image' ? imageAcceptValue : documentAcceptValue;

      const cleanup = () => {
        input.removeEventListener('change', handleChange);
        window.removeEventListener('focus', handleWindowFocus);
        input.remove();
      };

      const handleChange = () => {
        const selectedFile = input.files?.[0] ?? null;
        cleanup();
        resolve(selectedFile);
      };

      const handleWindowFocus = () => {
        window.setTimeout(() => {
          if (!input.files?.length) {
            cleanup();
            resolve(null);
          }
        }, 300);
      };

      input.addEventListener('change', handleChange, { once: true });
      window.addEventListener('focus', handleWindowFocus, { once: true });
      input.click();
    });
  }

  async function hydrate() {
    if (hasHydrated.value) {
      return;
    }

    const [assetList, folderList, tagList] = await Promise.all([
      listAssets(),
      listFolders(),
      listTags(),
    ]);

    assets.value = assetList;
    folders.value = folderList;
    tags.value = tagList;
    activeAssetId.value = assetList[0]?.id ?? '';
    hasHydrated.value = true;
  }

  function selectFolder(folderId: string) {
    activeFolderId.value = folderId;
  }

  function toggleTag(tagId: string) {
    selectedTagIds.value = selectedTagIds.value.includes(tagId)
      ? selectedTagIds.value.filter((current) => current !== tagId)
      : [...selectedTagIds.value, tagId];
  }

  function toggleAssetSelection(assetId: string) {
    selectedAssetIds.value = selectedAssetIds.value.includes(assetId)
      ? selectedAssetIds.value.filter((current) => current !== assetId)
      : [...selectedAssetIds.value, assetId];
  }

  function toggleSelectAllVisible() {
    if (isAllVisibleSelected.value) {
      selectedAssetIds.value = selectedAssetIds.value.filter(
        (assetId) => !paginatedAssets.value.some((asset) => asset.id === assetId),
      );
      return;
    }

    selectedAssetIds.value = Array.from(new Set([
      ...selectedAssetIds.value,
      ...paginatedAssets.value.map((asset) => asset.id),
    ]));
  }

  function setCurrentPage(page: number) {
    currentPage.value = Math.min(Math.max(page, 1), totalPageCount.value);
  }

  function selectAsset(assetId: string) {
    activeAssetId.value = assetId;
  }

  function closePreview() {
    isPreviewOpen.value = false;
    previewAssetId.value = '';
  }

  function openPreview(assetId: string) {
    previewAssetId.value = assetId;
    isPreviewOpen.value = true;
  }

  function clearSelection() {
    selectedAssetIds.value = [];
  }

  async function createFolderFromDraft() {
    const name = newFolderName.value.trim();
    if (!name) {
      addToast('文件夹名称不能为空', 'warning');
      return;
    }

    const folder = await createFolder(name, null);
    folders.value = [...folders.value, folder];
    activeFolderId.value = folder.id;
    newFolderName.value = '';
    isCreateFolderModalOpen.value = false;
    addToast('文件夹已创建', 'success');
  }

  function openRenameFolder(folderId: string) {
    const folder = folders.value.find((current) => current.id === folderId);
    if (!folder || folder.id === 'all-assets') {
      addToast('当前目录暂不支持重命名', 'warning');
      return;
    }

    folderToRenameId.value = folder.id;
    renameFolderName.value = folder.name;
    isRenameFolderModalOpen.value = true;
  }

  function closeRenameFolder() {
    isRenameFolderModalOpen.value = false;
    folderToRenameId.value = '';
    renameFolderName.value = '';
  }

  async function submitFolderRename() {
    const folder = folderPendingRename.value;
    const nextName = renameFolderName.value.trim();

    if (!folder) {
      closeRenameFolder();
      return;
    }

    if (!nextName) {
      addToast('文件夹名称不能为空', 'warning');
      return;
    }

    if (nextName === folder.name) {
      closeRenameFolder();
      return;
    }

    await renameFolder(folder.id, nextName);
    folders.value = folders.value.map((current) => current.id === folder.id
      ? { ...current, name: nextName }
      : current);
    closeRenameFolder();
    addToast('文件夹名称已更新', 'success');
  }

  function openDeleteFolder(folderId: string) {
    const folder = folders.value.find((current) => current.id === folderId);
    if (!folder || folder.id === 'all-assets') {
      addToast('当前目录暂不支持删除', 'warning');
      return;
    }

    folderToDeleteId.value = folder.id;
    isDeleteFolderModalOpen.value = true;
  }

  function closeDeleteFolder() {
    isDeleteFolderModalOpen.value = false;
    folderToDeleteId.value = '';
  }

  async function confirmFolderDelete() {
    const folder = folderPendingDelete.value;
    if (!folder) {
      closeDeleteFolder();
      return;
    }

    const hasAssets = assets.value.some((asset) => asset.folderId === folder.id);
    const hasChildren = folders.value.some((current) => current.parentId === folder.id);

    if (hasAssets || hasChildren) {
      addToast('请先清空目录中的资源与子目录', 'warning');
      return;
    }

    await deleteFolder(folder.id);
    folders.value = folders.value.filter((current) => current.id !== folder.id);
    if (activeFolderId.value === folder.id) {
      activeFolderId.value = 'all-assets';
    }
    closeDeleteFolder();
    addToast('文件夹已删除', 'warning');
  }

  async function renameActiveAsset() {
    if (!activeAsset.value) {
      return;
    }

    const currentName = activeAsset.value.name;
    const nextName = `${currentName.replace(/\.[^.]+$/, '')}-已整理.${activeAsset.value.extension}`;
    await renameAsset(activeAsset.value.id, nextName);
    assets.value = assets.value.map((asset) => asset.id === activeAsset.value?.id ? { ...asset, name: nextName } : asset);
    addToast('资源名称已更新', 'success');
  }

  async function replaceActiveAsset() {
    const selectedAsset = activeAsset.value;
    if (!selectedAsset) {
      return;
    }

    const selectedFile = await selectReplaceFile(selectedAsset.kind);
    if (!selectedFile) {
      return;
    }

    const errorMessage = validateUploadFile(selectedFile);
    if (errorMessage) {
      addToast(errorMessage, 'error');
      return;
    }

    const replacedAsset = await replaceAsset(selectedAsset.id, selectedFile);
    assets.value = assets.value.map((asset) => asset.id === replacedAsset.id ? replacedAsset : asset);
    addToast('资源文件已替换', 'success');
  }

  async function applySuggestedTagsToSelection() {
    if (selectedAssetIds.value.length === 0) {
      addToast('当前没有选中的资源', 'warning');
      return;
    }

    const suggestedTagId = 'tag-inline';
    await updateAssetTags(selectedAssetIds.value, [suggestedTagId]);
    assets.value = assets.value.map((asset) => selectedAssetIds.value.includes(asset.id)
      ? { ...asset, tagIds: Array.from(new Set([...asset.tagIds, suggestedTagId])) }
      : asset);
    addToast('已为选中资源补充推荐标签', 'success');
  }

  async function moveSelectedAssets() {
    if (selectedAssetIds.value.length === 0) {
      addToast('当前没有选中的资源', 'warning');
      return;
    }

    const fallbackFolder = folders.value.find((folder) => folder.id !== activeFolderId.value && folder.id !== 'all-assets')
      ?? folders.value.find((folder) => folder.id !== 'all-assets');

    if (!fallbackFolder) {
      addToast('当前没有可移动的目标文件夹', 'warning');
      return;
    }

    await moveAssets(selectedAssetIds.value, fallbackFolder.id);
    assets.value = assets.value.map((asset) => selectedAssetIds.value.includes(asset.id)
      ? { ...asset, folderId: fallbackFolder.id, updatedAt: new Date().toISOString() }
      : asset);
    addToast(`已移入 ${fallbackFolder.name}`, 'success');
  }

  async function deleteSelectedAssets() {
    if (selectedAssetIds.value.length === 0) {
      addToast('当前没有选中的资源', 'warning');
      return;
    }

    await deleteAssets(selectedAssetIds.value);
    assets.value = assets.value.filter((asset) => !selectedAssetIds.value.includes(asset.id));
    if (activeAssetId.value && !assets.value.some((asset) => asset.id === activeAssetId.value)) {
      activeAssetId.value = assets.value[0]?.id ?? '';
    }
    clearSelection();
    addToast('选中资源已删除', 'warning');
  }

  async function deleteActiveAsset() {
    if (!activeAsset.value) {
      return;
    }

    await deleteAssets([activeAsset.value.id]);
    assets.value = assets.value.filter((asset) => asset.id !== activeAsset.value?.id);
    activeAssetId.value = assets.value[0]?.id ?? '';
    addToast('资源已删除', 'warning');
  }

  async function queueUploadFiles(files: FileList | File[]) {
    const normalizedFiles = Array.from(files);
    if (normalizedFiles.length === 0) {
      return;
    }

    const validFiles: File[] = [];
    const currentBatchTaskIds: string[] = [];

    for (const file of normalizedFiles) {
      const errorMessage = validateUploadFile(file);
      const taskId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const kind = detectUploadKind(file) ?? 'document';

      if (errorMessage) {
        uploadTasks.value.unshift({
          id: taskId,
          fileName: file.name,
          kind,
          progress: 0,
          status: 'failed',
          folderId: activeFolderId.value,
          errorMessage,
          file,
        });
        addToast(errorMessage, 'error');
        continue;
      }

      validFiles.push(file);
      uploadTasks.value.unshift({
        id: taskId,
        fileName: file.name,
        kind,
        progress: 20,
        status: 'uploading',
        folderId: activeFolderId.value,
        file,
      });
      currentBatchTaskIds.push(taskId);
    }

    if (validFiles.length === 0) {
      return;
    }

    try {
      const uploadedAssets = await uploadAssets(validFiles, resolveUploadFolderId(activeFolderId.value));
      if (uploadedAssets.length === 0) {
        throw new Error('上传未返回任何资源');
      }

      assets.value = [...uploadedAssets, ...assets.value];
      currentPage.value = 1;

      for (const [index, taskId] of currentBatchTaskIds.entries()) {
        const task = findUploadTask(taskId);
        if (!task) {
          continue;
        }

        if (!uploadedAssets[index]) {
          task.progress = 0;
          task.status = 'failed';
          task.errorMessage = '上传结果异常，请重试';
          continue;
        }

        task.progress = 100;
        task.status = 'success';
        task.errorMessage = '';
      }

      activeAssetId.value = uploadedAssets[0]?.id ?? activeAssetId.value;
      addToast('资源上传完成', 'success');
    }
    catch (error) {
      const errorMessage = resolveRequestErrorMessage(error, '资源上传失败，请稍后重试');

      for (const taskId of currentBatchTaskIds) {
        const task = findUploadTask(taskId);
        if (!task) {
          continue;
        }

        task.progress = 0;
        task.status = 'failed';
        task.errorMessage = errorMessage;
      }

      addToast(errorMessage, 'error');
    }
  }

  async function retryUploadTask(taskId: string) {
    const task = findUploadTask(taskId);
    if (!task?.file) {
      return;
    }

    task.status = 'uploading';
    task.progress = 20;
    task.errorMessage = '';

    try {
      const uploadedAssets = await uploadAssets([task.file], resolveUploadFolderId(task.folderId));
      const uploadedAsset = uploadedAssets[0];
      if (!uploadedAsset) {
        throw new Error('上传未返回任何资源');
      }

      assets.value = [uploadedAsset, ...assets.value];
      currentPage.value = 1;
      activeAssetId.value = uploadedAsset.id;
      task.progress = 100;
      task.status = 'success';
      task.errorMessage = '';
      addToast('资源上传完成', 'success');
    }
    catch (error) {
      task.progress = 0;
      task.status = 'failed';
      task.errorMessage = resolveRequestErrorMessage(error, '资源上传失败，请稍后重试');
      addToast(task.errorMessage, 'error');
    }
  }

  watch([searchQuery, activeFolderId, activeKind, sortMode, selectedTagIds], () => {
    currentPage.value = 1;
  });

  watch(totalFilteredAssets, () => {
    if (currentPage.value > totalPageCount.value) {
      currentPage.value = totalPageCount.value;
    }
  });

  return {
    searchQuery,
    activeFolderId,
    activeKind,
    selectedTagIds,
    selectedAssetIds,
    sortMode,
    viewMode,
    currentPage,
    pageSize,
    uploadTasks,
    assets,
    folders,
    tags,
    activeAssetId,
    previewAssetId,
    isUploadPanelOpen,
    isPreviewOpen,
    isCreateFolderModalOpen,
    isRenameFolderModalOpen,
    isDeleteFolderModalOpen,
    newFolderName,
    renameFolderName,
    folderToRenameId,
    folderToDeleteId,
    visibleFolders,
    filteredAssets,
    totalFilteredAssets,
    paginatedAssets,
    activeAsset,
    previewAsset,
    stats,
    isAllVisibleSelected,
    folderPendingRename,
    folderPendingDelete,
    hydrate,
    selectFolder,
    toggleTag,
    selectAsset,
    toggleAssetSelection,
    toggleSelectAllVisible,
    openPreview,
    closePreview,
    createFolderFromDraft,
    openRenameFolder,
    closeRenameFolder,
    submitFolderRename,
    openDeleteFolder,
    closeDeleteFolder,
    confirmFolderDelete,
    renameActiveAsset,
    replaceActiveAsset,
    applySuggestedTagsToSelection,
    moveSelectedAssets,
    deleteSelectedAssets,
    deleteActiveAsset,
    queueUploadFiles,
    retryUploadTask,
    setCurrentPage,
  };
}

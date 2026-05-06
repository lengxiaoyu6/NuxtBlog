<template>
  <div class="space-y-8 pb-20">
    <!-- 媒体库 上传资源 新建文件夹 -->
    <MediaSummaryRow
      :stats="media.stats.value"
      @open-upload="media.isUploadPanelOpen.value = true"
      @create-folder="media.isCreateFolderModalOpen.value = true"
    />

    <UCard :ui="{ root: 'admin-theme-card overflow-hidden rounded-[2rem] border-slate-200 dark:border-slate-800', body: 'p-0 sm:p-0', header: 'p-5 sm:p-6' }">
      <template #header>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-3">
            <div class="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
              <UIcon name="i-lucide-image" class="size-5" />
            </div>
            <div>
              <h1 class="text-xl font-black text-slate-900 dark:text-white">媒体库</h1>
              <p class="text-sm text-slate-500 dark:text-slate-400">管理图片、封面与附件资源。</p>
            </div>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <UButton color="neutral" variant="soft" icon="i-lucide-folder-plus" class="justify-center" @click="media.isCreateFolderModalOpen.value = true">
              新建文件夹
            </UButton>
            <UButton icon="i-lucide-upload-cloud" class="justify-center" @click="media.isUploadPanelOpen.value = true">
              上传资源
            </UButton>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside class="border-b border-slate-200/70 p-5 dark:border-slate-800 xl:border-b-0 xl:border-r">
          <MediaFolderSidebar
            :folders="media.visibleFolders.value"
            :active-folder-id="media.activeFolderId.value"
            @select-folder="media.selectFolder"
            @rename-folder="media.openRenameFolder"
            @delete-folder="media.openDeleteFolder"
          />
        </aside>

        <div class="min-w-0">
          <header class="border-b border-slate-200/70 p-5 dark:border-slate-800">
            <MediaToolbar
              :search-query="media.searchQuery.value"
              :sort-mode="media.sortMode.value"
              :view-mode="media.viewMode.value"
              :active-kind="media.activeKind.value"
              :tags="media.tags.value"
              :selected-tag-ids="media.selectedTagIds.value"
              @update:search-query="media.searchQuery.value = $event"
              @update:sort-mode="media.sortMode.value = $event"
              @update:view-mode="media.viewMode.value = $event"
              @update:active-kind="media.activeKind.value = $event"
              @toggle-tag="media.toggleTag"
            />
          </header>

          <main class="min-w-0 p-5">
            <div class="space-y-5">
              <MediaBulkToolbar
                v-if="media.selectedAssetIds.value.length > 0"
                :selected-count="media.selectedAssetIds.value.length"
                @move-folder="media.moveSelectedAssets"
                @edit-tags="media.applySuggestedTagsToSelection"
                @delete-assets="media.deleteSelectedAssets"
                @clear="media.selectedAssetIds.value = []"
              />

              <MediaAssetGrid
                v-if="viewMode === 'grid'"
                :assets="media.paginatedAssets.value"
                :selected-asset-ids="media.selectedAssetIds.value"
                @select-asset="media.openPreview"
                @toggle-selection="media.toggleAssetSelection"
                @open-preview="media.openPreview"
              />

              <MediaAssetTable
                v-else
                :assets="media.paginatedAssets.value"
                :folders="media.visibleFolders.value"
                :selected-asset-ids="media.selectedAssetIds.value"
                :all-selected="media.isAllVisibleSelected.value"
                @select-asset="media.openPreview"
                @toggle-selection="media.toggleAssetSelection"
                @toggle-select-all="media.toggleSelectAllVisible"
                @open-preview="media.openPreview"
              />

              <div
                v-if="media.filteredAssets.value.length === 0"
                class="admin-theme-card flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <UIcon name="i-lucide-folder-search-2" class="size-8 text-slate-300 dark:text-slate-600" />
                <p class="mt-5 text-base font-bold text-slate-900 dark:text-white">当前筛选条件下没有匹配资源</p>
                <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  调整文件夹、标签、搜索词或资源类型后可重新查看列表。
                </p>
              </div>

              <div
                v-else
                class="admin-theme-card flex flex-col gap-4 rounded-[1.75rem] border border-slate-200/70 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <p class="text-xs font-bold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
                  当前显示 {{ (media.currentPage.value - 1) * media.pageSize + 1 }} - {{ Math.min(media.currentPage.value * media.pageSize, media.totalFilteredAssets.value) }}
                  项，共 {{ media.totalFilteredAssets.value }} 项
                </p>
                <PaginationNav
                  :current-page="media.currentPage.value"
                  :total-items="media.totalFilteredAssets.value"
                  :items-per-page="media.pageSize"
                  @page-change="media.setCurrentPage"
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </UCard>

    <MediaUploadPanel
      :open="media.isUploadPanelOpen.value"
      :tasks="media.uploadTasks.value"
      @close="media.isUploadPanelOpen.value = false"
      @select-files="media.queueUploadFiles"
      @retry-task="media.retryUploadTask"
    />

    <MediaPreviewModal
      :open="media.isPreviewOpen.value"
      :asset="media.previewAsset.value"
      @close="media.closePreview"
    />

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="media.isCreateFolderModalOpen.value"
        class="fixed inset-0 z-[85] bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
        @click.self="media.isCreateFolderModalOpen.value = false"
      >
        <div class="admin-theme-card mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <h2 class="text-xl font-black text-slate-900 dark:text-white">新建文件夹</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">输入新的归档目录名称，资源仍可通过标签跨目录检索。</p>

          <input
            v-model="media.newFolderName.value"
            type="text"
            placeholder="例如：活动物料"
            class="mt-5 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-700 dark:bg-slate-950"
          >

          <div class="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              class="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              @click="media.isCreateFolderModalOpen.value = false"
            >
              取消
            </button>
            <button
              type="button"
              class="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
              @click="media.createFolderFromDraft"
            >
              创建文件夹
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="media.isRenameFolderModalOpen.value"
        class="fixed inset-0 z-[85] bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
        @click.self="media.closeRenameFolder"
      >
        <div class="admin-theme-card mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <h2 class="text-xl font-black text-slate-900 dark:text-white">重命名文件夹</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            当前目录：{{ media.folderPendingRename.value?.name ?? '未选择目录' }}
          </p>

          <input
            v-model="media.renameFolderName.value"
            type="text"
            placeholder="输入新的文件夹名称"
            class="mt-5 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-700 dark:bg-slate-950"
          >

          <div class="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              class="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              @click="media.closeRenameFolder"
            >
              取消
            </button>
            <button
              type="button"
              class="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
              @click="media.submitFolderRename"
            >
              保存名称
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="media.isDeleteFolderModalOpen.value"
        class="fixed inset-0 z-[85] bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
        @click.self="media.closeDeleteFolder"
      >
        <div class="admin-theme-card mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <h2 class="text-xl font-black text-slate-900 dark:text-white">删除文件夹</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            将尝试删除目录“{{ media.folderPendingDelete.value?.name ?? '未选择目录' }}”。目录内仍有资源或子目录时会阻止删除。
          </p>

          <div class="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              class="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              @click="media.closeDeleteFolder"
            >
              取消
            </button>
            <button
              type="button"
              class="inline-flex h-10 items-center rounded-xl bg-rose-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700"
              @click="media.confirmFolderDelete"
            >
              删除文件夹
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MediaAssetGrid from '~/components/admin/media/MediaAssetGrid.vue';
import MediaAssetTable from '~/components/admin/media/MediaAssetTable.vue';
import MediaBulkToolbar from '~/components/admin/media/MediaBulkToolbar.vue';
import MediaFolderSidebar from '~/components/admin/media/MediaFolderSidebar.vue';
import MediaPreviewModal from '~/components/admin/media/MediaPreviewModal.vue';
import MediaSummaryRow from '~/components/admin/media/MediaSummaryRow.vue';
import MediaToolbar from '~/components/admin/media/MediaToolbar.vue';
import MediaUploadPanel from '~/components/admin/media/MediaUploadPanel.vue';
import PaginationNav from '~/components/PaginationNav.vue';
import { useAdminMediaLibrary } from '~/composables/useAdminMediaLibrary';

definePageMeta({
  layout: 'admin',
});

const media = useAdminMediaLibrary();
await media.hydrate();

const viewMode = computed(() => media.viewMode.value);
</script>

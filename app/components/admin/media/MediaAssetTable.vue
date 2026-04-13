<template>
  <div class="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div class="overflow-x-auto">
      <table class="min-w-[900px] w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <th class="px-6 py-4 w-12">
              <input
                type="checkbox"
                :checked="allSelected"
                class="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                @change="$emit('toggle-select-all')"
              >
            </th>
            <th class="px-4 py-4">名称</th>
            <th class="px-4 py-4">类型</th>
            <th class="px-4 py-4">大小</th>
            <th class="px-4 py-4">文件夹</th>
            <th class="px-4 py-4">上传时间</th>
            <th class="px-8 py-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50 dark:divide-slate-800/70">
          <tr
            v-for="asset in assets"
            :key="asset.id"
            class="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/20"
            :class="selectedAssetIds.includes(asset.id) ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''"
          >
            <td class="px-6 py-5">
              <input
                type="checkbox"
                :checked="selectedAssetIds.includes(asset.id)"
                class="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                @change="$emit('toggle-selection', asset.id)"
              >
            </td>
            <td class="px-4 py-5">
              <button type="button" class="text-left" @click="$emit('select-asset', asset.id)">
                <p class="font-bold text-slate-900 dark:text-white">{{ asset.name }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ asset.usage.length }} 处引用</p>
              </button>
            </td>
            <td class="px-4 py-5">
              <span class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {{ asset.kind === 'image' ? '图片' : '文档' }}
              </span>
            </td>
            <td class="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
              {{ formatFileSize(asset.size) }}
            </td>
            <td class="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
              {{ folderNameMap[asset.folderId] ?? asset.folderId }}
            </td>
            <td class="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
              {{ asset.updatedAt }}
            </td>
            <td class="px-8 py-5 text-right">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700"
                @click="$emit('open-preview', asset.id)"
              >
                查看
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MediaAsset, MediaFolder } from '~/types/admin-media';

const props = defineProps<{
  assets: MediaAsset[];
  folders: MediaFolder[];
  selectedAssetIds: string[];
  allSelected: boolean;
}>();

defineEmits<{
  (event: 'select-asset', assetId: string): void;
  (event: 'toggle-selection', assetId: string): void;
  (event: 'toggle-select-all'): void;
  (event: 'open-preview', assetId: string): void;
}>();

const folderNameMap = computed(() => {
  return Object.fromEntries(props.folders.map((folder) => [folder.id, folder.name]));
});

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}
</script>

<template>
  <article
    class="group overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    :class="selected ? 'ring-2 ring-brand-500/50' : ''"
  >
    <div class="relative">
      <button
        type="button"
        class="absolute right-2.5 top-2.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition-colors hover:text-brand-600 dark:bg-slate-900/90 dark:text-slate-200"
        @click.stop="$emit('toggle-selection', asset.id)"
      >
        <Check v-if="selected" :size="14" />
        <Circle v-else :size="14" />
      </button>

      <button
        type="button"
        class="block w-full text-left"
        @click="$emit('select-asset', asset.id)"
        @dblclick="$emit('open-preview', asset.id)"
      >
        <div v-if="asset.kind === 'image'" class="aspect-[3/2] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img :src="asset.previewUrl" :alt="asset.name" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">
        </div>
        <div v-else class="flex aspect-[3/2] items-center justify-center bg-slate-50 dark:bg-slate-800">
          <div class="space-y-2 text-center">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-200">
              <FileText :size="20" />
            </div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
              {{ asset.extension }}
            </p>
          </div>
        </div>
      </button>
    </div>

    <div class="space-y-2 p-3">
      <div>
        <p class="truncate text-sm font-bold text-slate-900 dark:text-white">
          {{ asset.name }}
        </p>
        <p class="mt-0.5 text-xs text-slate-400">
          {{ asset.kind === 'image' ? '图片资源' : '文档资源' }} · {{ asset.usage.length }} 处引用
        </p>
      </div>

      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="tagId in asset.tagIds"
          :key="tagId"
          class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300"
        >
          {{ tagIdLabelMap[tagId] ?? tagId }}
        </span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-400">{{ asset.updatedAt }}</span>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-xs font-bold text-brand-600 transition-colors hover:text-brand-700"
          @click="$emit('open-preview', asset.id)"
        >
          <Eye :size="14" />
          预览
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Check, Circle, Eye, FileText } from 'lucide-vue-next';
import type { MediaAsset } from '~/types/admin-media';

defineProps<{
  asset: MediaAsset;
  selected: boolean;
}>();

defineEmits<{
  (event: 'select-asset', assetId: string): void;
  (event: 'toggle-selection', assetId: string): void;
  (event: 'open-preview', assetId: string): void;
}>();

const tagIdLabelMap: Record<string, string> = {
  'tag-cover': '封面图',
  'tag-inline': '正文配图',
  'tag-attachment': '下载附件',
  'tag-banner': '横幅',
};
</script>

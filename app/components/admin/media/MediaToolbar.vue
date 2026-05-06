<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in tags"
          :key="tag.id"
          type="button"
          class="inline-flex items-center rounded-full border px-3 py-2 text-xs font-bold transition-colors"
          :class="selectedTagIds.includes(tag.id)
            ? colorClassMap[tag.color]
            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'"
          @click="$emit('toggle-tag', tag.id)"
        >
          {{ tag.name }}
        </button>
      </div>

      <div class="relative w-full xl:max-w-sm">
        <Search class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" :size="16" />
        <input
          :value="searchQuery"
          type="text"
          placeholder="搜索资源名称、格式或用途"
          class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-700 dark:bg-slate-950"
          @input="$emit('update:search-query', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>

    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
          <button
            v-for="option in kindOptions"
            :key="option.value"
            type="button"
            class="rounded-lg px-3 py-2 text-xs font-bold transition-colors"
            :class="activeKind === option.value
              ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'"
            @click="$emit('update:active-kind', option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <select
          :value="sortMode"
          class="h-11 min-w-[8rem] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-all focus:border-brand-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          @change="$emit('update:sort-mode', ($event.target as HTMLSelectElement).value as MediaSortMode)"
        >
          <option value="newest">最新优先</option>
          <option value="oldest">最早优先</option>
          <option value="name">名称排序</option>
        </select>
      </div>

      <div class="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
        <button
          v-for="mode in viewOptions"
          :key="mode.value"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors"
          :class="viewMode === mode.value
            ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'"
          @click="$emit('update:view-mode', mode.value)"
        >
          <component :is="mode.icon" :size="14" />
          {{ mode.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LayoutGrid, List, Search } from '~/utils/admin-lucide-icons';
import type { MediaKindFilter, MediaSortMode, MediaTag, MediaViewMode } from '~/types/admin-media';

defineProps<{
  searchQuery: string;
  sortMode: MediaSortMode;
  viewMode: MediaViewMode;
  activeKind: MediaKindFilter;
  tags: MediaTag[];
  selectedTagIds: string[];
}>();

defineEmits<{
  (event: 'update:search-query', value: string): void;
  (event: 'update:sort-mode', value: MediaSortMode): void;
  (event: 'update:view-mode', value: MediaViewMode): void;
  (event: 'update:active-kind', value: MediaKindFilter): void;
  (event: 'toggle-tag', tagId: string): void;
}>();

const kindOptions = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'document', label: '文档' },
] as const;

const viewOptions = [
  { value: 'grid', label: '卡片', icon: LayoutGrid },
  { value: 'table', label: '列表', icon: List },
] as const;

const colorClassMap = {
  slate: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
  blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200',
  amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200',
  rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200',
} as const;
</script>

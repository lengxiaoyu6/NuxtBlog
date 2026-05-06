<template>
  <article class="admin-theme-card overflow-hidden rounded-[1.5rem] border border-slate-200/80 dark:border-slate-700/80">
    <div class="flex items-start justify-between gap-3 border-b border-slate-200/70 p-4 dark:border-slate-800/80">
      <div class="min-w-0 space-y-1">
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold"
            :class="project.enabled
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-300'"
          >
            {{ project.enabled ? '展示中' : '已停用' }}
          </span>
          <span class="text-xs text-slate-400">{{ tagCountText }}</span>
        </div>
        <h3 class="truncate text-base font-black text-slate-900 dark:text-white">{{ titleText }}</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ categoryText }}</p>
      </div>

      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
        @click="emit('remove')"
      >
        <Trash2 :size="15" />
      </button>
    </div>

    <div class="space-y-4 p-4">
      <div class="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div
          v-if="project.image.trim()"
          class="flex h-40 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_60%)] p-3"
        >
          <img :src="project.image" :alt="titleText" class="h-full w-full rounded-[1rem] object-cover">
        </div>
        <div v-else class="flex h-40 flex-col items-center justify-center gap-2 bg-slate-50 text-center dark:bg-slate-950">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <ImageIcon :size="20" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-bold text-slate-900 dark:text-white">等待封面图片</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">填写图片链接后可在此处预览</p>
          </div>
        </div>
      </div>

      <p class="line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-slate-500 dark:text-slate-400">
        {{ descriptionText }}
      </p>

      <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <span class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 dark:border-slate-800 dark:bg-slate-950/50">{{ tagCountText }}</span>
        <span class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 dark:border-slate-800 dark:bg-slate-950/50">{{ linkCountText }}</span>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white">
          <input v-model="project.enabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500">
          在前台展示
        </label>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-700"
          @click="emit('edit')"
        >
          <PencilLine :size="15" />
          编辑项目
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ManagedProjectItem } from '~/types/page-settings';
import {
  ImageIcon,
  PencilLine,
  Trash2,
} from '~/utils/admin-lucide-icons';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  project: ManagedProjectItem;
  tagsValue: string;
}>();

const emit = defineEmits<{
  edit: [];
  remove: [];
}>();

const titleText = computed(() => props.project.title.trim() || '未命名项目');
const categoryText = computed(() => props.project.category.trim() || '未分类项目');
const descriptionText = computed(() => props.project.description.trim() || '填写项目描述后会在此处显示摘要。');
const tagCountText = computed(() => {
  const count = props.tagsValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .length;

  return `${count} 个标签`;
});
const linkCountText = computed(() => {
  const count = [props.project.githubUrl, props.project.demoUrl]
    .filter((item) => item.trim())
    .length;

  return `${count} 个链接`;
});
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
            媒体库
          </h1>
          <span class="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300">
            图片与文档
          </span>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          统一管理站点封面图、正文配图与下载附件，后续可复用到文章编辑器选择器。
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:col-span-2 lg:grid-cols-4">
        <article
          v-for="stat in stats"
          :key="stat.id"
          class="rounded-[1.5rem] border border-slate-100 bg-white px-3 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-4"
        >
          <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10" :class="iconPanelClassMap[stat.id]">
                  <component :is="iconMap[stat.id]" :size="16" />
                </div>
                <p class="text-lg font-black text-slate-900 dark:text-white sm:text-2xl">
                  {{ stat.value }}
                </p>
              </div>
              <p class="truncate text-xs font-bold text-slate-500 dark:text-slate-300 sm:text-sm">
                {{ stat.label }}
              </p>
            </div>
            <p class="hidden max-w-[7rem] text-xs text-slate-400 dark:text-slate-500 xl:block">
              {{ stat.hint }}
            </p>
          </div>
        </article>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:col-start-2 lg:row-start-1 lg:flex lg:justify-self-end">
        <button
          type="button"
          class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:w-auto"
          @click="$emit('create-folder')"
        >
          <FolderPlus :size="18" />
          新建文件夹
        </button>
        <button
          type="button"
          class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 lg:w-auto"
          @click="$emit('open-upload')"
        >
          <Upload :size="18" />
          上传资源
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock3, FileText, FolderKanban, FolderPlus, Image as ImageIcon, Upload } from 'lucide-vue-next';
import type { MediaStat } from '~/types/admin-media';

defineProps<{
  stats: MediaStat[];
}>();

defineEmits<{
  (event: 'open-upload'): void;
  (event: 'create-folder'): void;
}>();

const iconMap = {
  all: FolderKanban,
  image: ImageIcon,
  document: FileText,
  recent: Clock3,
} as const;

const iconPanelClassMap = {
  all: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200',
  image: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  document: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  recent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
} as const;
</script>

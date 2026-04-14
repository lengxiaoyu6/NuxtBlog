<template>
  <section class="space-y-4">
    <div class="space-y-1.5">
      <div class="flex items-center gap-2">
        <FolderTree :size="18" class="text-brand-600" />
        <h2 class="text-sm font-black uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
          文件夹
        </h2>
      </div>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        按归档目录浏览媒体资源。
      </p>
    </div>

    <div class="space-y-2">
      <div
        v-for="folder in folders"
        :key="folder.id"
        class="group relative flex items-center gap-2 rounded-2xl px-3 py-2 transition-colors"
        :class="activeFolderId === folder.id
          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-200'
          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'"
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left md:transition-[padding] md:duration-200 md:group-hover:pr-[5rem] md:group-focus-within:pr-[5rem]"
          @click="$emit('select-folder', folder.id)"
        >
          <div class="relative min-w-0 flex-1">
            <p class="truncate text-sm font-bold">{{ folder.name }}</p>
            <div class="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-max max-w-[16rem] rounded-xl bg-slate-950/95 px-3 py-2 text-xs font-medium text-white shadow-lg md:group-hover:block md:group-focus-within:block">
              {{ folder.name }}
            </div>
          </div>
          <span class="inline-flex min-w-7 shrink-0 items-center justify-center rounded-full bg-white/80 px-2 py-1 text-xs font-bold text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-200">
            {{ folder.assetCount }}
          </span>
        </button>

        <div v-if="folder.id !== 'all-assets'" class="flex shrink-0 items-center gap-1 md:absolute md:right-3 md:top-1/2 md:-translate-y-1/2 md:justify-end md:pointer-events-none md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/80 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-300"
            @click="$emit('rename-folder', folder.id)"
          >
            <PencilLine :size="15" />
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/80 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-300"
            @click="$emit('delete-folder', folder.id)"
          >
            <Trash2 :size="15" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { FolderTree, PencilLine, Trash2 } from 'lucide-vue-next';
import type { MediaFolder } from '~/types/admin-media';

defineProps<{
  folders: MediaFolder[];
  activeFolderId: string;
}>();

defineEmits<{
  (event: 'select-folder', folderId: string): void;
  (event: 'rename-folder', folderId: string): void;
  (event: 'delete-folder', folderId: string): void;
}>();
</script>

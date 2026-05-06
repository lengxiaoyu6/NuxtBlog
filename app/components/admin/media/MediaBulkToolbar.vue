<template>
  <div class="admin-theme-card flex flex-col gap-3 rounded-[2rem] border border-brand-100 bg-brand-50/70 p-4 shadow-sm dark:border-brand-900/40 dark:bg-brand-900/10 lg:flex-row lg:items-center lg:justify-between">
    <div class="flex items-center gap-3">
      <span class="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-bold text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-200">
        已选 {{ selectedCount }} 项
      </span>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        批量移动、补标签或删除。
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        @click="$emit('move-folder')"
      >
        <FolderInput :size="16" />
        批量移动
      </button>
      <button
        type="button"
        class="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        @click="$emit('edit-tags')"
      >
        <Tags :size="16" />
        批量补标签
      </button>
      <button
        type="button"
        class="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700"
        @click="$emit('delete-assets')"
      >
        <Trash2 :size="16" />
        批量删除
      </button>
      <button
        type="button"
        class="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        @click="$emit('clear')"
      >
        清空选择
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FolderInput, Tags, Trash2 } from '~/utils/admin-lucide-icons';

defineProps<{
  selectedCount: number;
}>();

defineEmits<{
  (event: 'move-folder'): void;
  (event: 'edit-tags'): void;
  (event: 'delete-assets'): void;
  (event: 'clear'): void;
}>();
</script>

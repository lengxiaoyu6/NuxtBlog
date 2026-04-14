<template>
  <aside class="space-y-5">
    <section class="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <template v-if="asset">
        <div class="mb-4 flex items-center gap-2">
          <PanelRightOpen :size="18" class="text-brand-600" />
          <h2 class="text-sm font-black uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
            资源详情
          </h2>
        </div>

        <div v-if="asset.kind === 'image'" class="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
          <img :src="asset.previewUrl" :alt="asset.name" class="h-44 w-full object-cover">
        </div>
        <div v-else class="flex h-44 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
          <div class="text-center">
            <FileText :size="28" class="mx-auto text-slate-500 dark:text-slate-300" />
            <p class="mt-3 text-sm font-bold text-slate-900 dark:text-white">{{ asset.extension.toUpperCase() }}</p>
          </div>
        </div>

        <div class="mt-5 space-y-4">
          <div>
            <p class="text-sm font-bold text-slate-900 dark:text-white">{{ asset.name }}</p>
            <p class="mt-1 text-xs text-slate-400">{{ asset.kind === 'image' ? '图片资源' : '文档资源' }}</p>
          </div>

          <dl class="space-y-3 text-sm">
            <div class="flex items-start justify-between gap-3">
              <dt class="text-slate-400">所属文件夹</dt>
              <dd class="text-right font-medium text-slate-700 dark:text-slate-200">{{ folderName }}</dd>
            </div>
            <div class="flex items-start justify-between gap-3">
              <dt class="text-slate-400">引用次数</dt>
              <dd class="text-right font-medium text-slate-700 dark:text-slate-200">{{ asset.usage.length }}</dd>
            </div>
            <div class="flex items-start justify-between gap-3">
              <dt class="text-slate-400">更新时间</dt>
              <dd class="text-right font-medium text-slate-700 dark:text-slate-200">{{ asset.updatedAt }}</dd>
            </div>
          </dl>

          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in resolvedTags"
              :key="tag.id"
              class="inline-flex rounded-full border px-3 py-1 text-xs font-bold"
              :class="tagColorClassMap[tag.color]"
            >
              {{ tag.name }}
            </span>
          </div>

          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-400">引用记录</p>
            <ul class="mt-3 space-y-3">
              <li v-for="usage in asset.usage" :key="usage.id" class="rounded-xl bg-white px-3 py-3 text-sm dark:bg-slate-900">
                <p class="font-bold text-slate-900 dark:text-white">{{ usage.targetTitle }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ usage.type }} · {{ usage.updatedAt }}</p>
              </li>
              <li v-if="asset.usage.length === 0" class="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-400 dark:border-slate-700">
                当前还没有引用记录。
              </li>
            </ul>
          </div>

          <div class="grid gap-2">
            <button
              type="button"
              class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              @click="$emit('rename-asset')"
            >
              <PencilLine :size="16" />
              重命名
            </button>
            <button
              type="button"
              class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              @click="$emit('replace-asset')"
            >
              <RefreshCcw :size="16" />
              替换文件
            </button>
            <button
              type="button"
              class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700"
              @click="$emit('delete-asset')"
            >
              <Trash2 :size="16" />
              删除资源
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-5 text-center dark:border-slate-700">
          <PanelRightOpen :size="24" class="text-slate-300 dark:text-slate-600" />
          <p class="mt-5 text-base font-bold text-slate-900 dark:text-white">尚未选中资源</p>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">点击卡片或表格行后，右侧会显示资源详情与引用信息。</p>
        </div>
      </template>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FileText, PanelRightOpen, PencilLine, RefreshCcw, Trash2 } from 'lucide-vue-next';
import type { MediaAsset, MediaFolder, MediaTag } from '~/types/admin-media';

const props = defineProps<{
  asset: MediaAsset | null;
  folders: MediaFolder[];
  tags: MediaTag[];
}>();

defineEmits<{
  (event: 'rename-asset'): void;
  (event: 'replace-asset'): void;
  (event: 'delete-asset'): void;
}>();

const folderName = computed(() => {
  if (!props.asset) {
    return '';
  }

  return props.folders.find((folder) => folder.id === props.asset?.folderId)?.name ?? '未分组';
});

const resolvedTags = computed(() => {
  if (!props.asset) {
    return [] as MediaTag[];
  }

  return props.tags.filter((tag) => props.asset?.tagIds.includes(tag.id));
});

const tagColorClassMap = {
  slate: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
  blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200',
  amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200',
  rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200',
} as const;
</script>

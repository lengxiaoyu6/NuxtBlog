<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="open && asset" class="fixed inset-0 z-[90] bg-slate-950/70 px-4 py-8 backdrop-blur-sm" @click.self="$emit('close')">
      <div class="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-950 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 class="text-lg font-black text-white">{{ asset.name }}</h2>
            <p class="mt-1 text-sm text-slate-400">{{ asset.kind === 'image' ? '图片预览' : '文档信息预览' }}</p>
          </div>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            @click="$emit('close')"
          >
            <X :size="18" />
          </button>
        </div>

        <div class="max-h-[75vh] overflow-auto p-6">
          <img
            v-if="asset.kind === 'image'"
            :src="asset.previewUrl"
            :alt="asset.name"
            class="max-h-[65vh] w-full rounded-2xl object-contain"
          >
          <div v-else class="grid gap-4 rounded-2xl bg-slate-900 p-6 text-sm text-slate-300 sm:grid-cols-2">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-500">格式</p>
              <p class="mt-2 text-base font-bold text-white">{{ asset.extension.toUpperCase() }}</p>
            </div>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-500">大小</p>
              <p class="mt-2 text-base font-bold text-white">{{ formatFileSize(asset.size) }}</p>
            </div>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-500">更新时间</p>
              <p class="mt-2 text-base font-bold text-white">{{ asset.updatedAt }}</p>
            </div>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-500">引用次数</p>
              <p class="mt-2 text-base font-bold text-white">{{ asset.usage.length }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';
import type { MediaAsset } from '~/types/admin-media';

defineProps<{
  open: boolean;
  asset: MediaAsset | null;
}>();

defineEmits<{
  (event: 'close'): void;
}>();

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="open" class="fixed inset-0 z-[80] bg-slate-950/45 px-4 py-8 backdrop-blur-sm" @click.self="$emit('close')">
      <div class="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">上传资源</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">图片仅接受真实图片二进制，文档仅接受 PDF、DOCX、ZIP 对应格式。</p>
          </div>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            @click="$emit('close')"
          >
            <X :size="18" />
          </button>
        </div>

        <button
          type="button"
          class="mt-6 flex w-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-brand-500 dark:hover:bg-brand-900/10"
          @click="openFilePicker"
          @dragover.prevent
          @drop.prevent="handleFileDrop"
        >
          <UploadCloud :size="30" class="text-brand-600" />
          <p class="mt-4 text-base font-bold text-slate-900 dark:text-white">拖拽文件到此处，或点击选择文件</p>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">图片与文档大小上限均为 10 MB，服务端会重新校验真实格式。</p>
        </button>

        <div class="mt-6 space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-400">上传队列</p>
            <p class="text-xs text-slate-400">{{ tasks.length }} 项</p>
          </div>

          <div v-if="tasks.length > 0" class="space-y-3">
            <div
              v-for="task in tasks"
              :key="task.id"
              class="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ task.fileName }}</p>
                  <p class="mt-1 text-xs text-slate-400">{{ task.kind === 'image' ? '图片资源' : '文档资源' }}</p>
                </div>
                <button
                  v-if="task.status === 'failed'"
                  type="button"
                  class="inline-flex h-8 items-center rounded-lg bg-white px-3 text-xs font-bold text-brand-600 shadow-sm dark:bg-slate-900"
                  @click="$emit('retry-task', task.id)"
                >
                  重试
                </button>
              </div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div class="h-full rounded-full bg-brand-600 transition-all" :style="{ width: `${task.progress}%` }" />
              </div>
              <p class="mt-2 text-xs" :class="task.status === 'failed' ? 'text-rose-500' : 'text-slate-400'">
                {{ task.errorMessage || statusTextMap[task.status] }}
              </p>
            </div>
          </div>
          <div v-else class="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
            当前还没有上传任务。
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { UploadCloud, X } from 'lucide-vue-next';
import type { MediaUploadTask } from '~/types/admin-media';

defineProps<{
  open: boolean;
  tasks: MediaUploadTask[];
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'select-files', files: FileList | File[]): void;
  (event: 'retry-task', taskId: string): void;
}>();

const uploadAcceptValue = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.pdf,.docx,.zip,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip';

const statusTextMap = {
  queued: '等待上传',
  uploading: '上传中',
  success: '上传完成',
  failed: '上传失败',
} as const;

async function openFilePicker() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const files = await new Promise<FileList | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = uploadAcceptValue;

    const cleanup = () => {
      input.removeEventListener('change', handleChange);
      window.removeEventListener('focus', handleWindowFocus);
      input.remove();
    };

    const handleChange = () => {
      const selectedFiles = input.files;
      cleanup();
      resolve(selectedFiles?.length ? selectedFiles : null);
    };

    const handleWindowFocus = () => {
      window.setTimeout(() => {
        if (!input.files?.length) {
          cleanup();
          resolve(null);
        }
      }, 300);
    };

    input.addEventListener('change', handleChange, { once: true });
    window.addEventListener('focus', handleWindowFocus, { once: true });
    input.click();
  });

  if (!files?.length) {
    return;
  }

  emit('select-files', files);
}

function handleFileDrop(event: DragEvent) {
  const files = event.dataTransfer?.files;
  if (!files?.length) {
    return;
  }

  emit('select-files', files);
}
</script>

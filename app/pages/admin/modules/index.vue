<template>
  <div class="space-y-8 pb-20">
    <UCard :ui="{ root: 'admin-theme-card rounded-[2rem] border-slate-200 dark:border-slate-800', body: 'p-5 sm:p-6' }">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="font-serif text-3xl font-black tracking-tight text-slate-900 dark:text-white">模块插件</h1>
            <span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
              <UIcon name="i-lucide-package" class="size-4" />
              共 {{ modules.length }} 个模块
            </span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            通过统一的模块中心管理安装状态、启用状态与独立配置页面。当前已内置 `notification-center` 通知模块。
          </p>
          <div
            v-if="feedbackMessage"
            class="inline-flex max-w-full items-start gap-2 rounded-2xl border px-4 py-3 text-sm"
            :class="feedbackTone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'"
          >
            <UIcon v-if="feedbackTone === 'error'" name="i-lucide-alert-circle" class="mt-0.5 size-4 shrink-0" />
            <UIcon v-else name="i-lucide-shield-check" class="mt-0.5 size-4 shrink-0" />
            <span>{{ feedbackMessage }}</span>
          </div>
        </div>

        <UButton
          color="neutral"
          variant="soft"
          :loading="loadState === 'loading'"
          :disabled="loadState === 'loading'"
          :icon="loadState === 'loading' ? undefined : 'i-lucide-refresh-cw'"
          class="justify-center"
          @click="fetchModules"
        >
          刷新模块状态
        </UButton>
      </div>
    </UCard>

    <UCard
      v-if="loadState === 'loading'"
      :ui="{ root: 'admin-theme-card rounded-[2rem] border-slate-200 dark:border-slate-800', body: 'flex min-h-[18rem] items-center justify-center p-6' }"
    >
      <div class="inline-flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-300">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
        正在读取模块列表...
      </div>
    </UCard>

    <UCard
      v-else-if="loadState === 'error'"
      :ui="{ root: 'admin-theme-card rounded-[2rem] border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20', body: 'p-6' }"
    >
      <div class="flex items-start gap-3 text-rose-700 dark:text-rose-200">
        <AlertCircle :size="18" class="mt-0.5 shrink-0" />
        <div class="space-y-2">
          <h2 class="text-lg font-black">模块列表读取失败</h2>
          <p class="text-sm leading-6">{{ errorMessage }}</p>
        </div>
      </div>
    </UCard>

    <section v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <UCard
        v-for="moduleItem in modules"
        :key="moduleItem.key"
        :ui="{ root: 'admin-theme-card w-full rounded-[2rem] border-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800', body: 'p-4 sm:p-5' }"
      >
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300">
                  <UIcon name="i-lucide-package" class="size-5" />
                </div>
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-lg font-black text-slate-900 dark:text-white">{{ moduleItem.name }}</h2>
                    <span class="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                      v{{ moduleItem.version }}
                    </span>
                  </div>
                  <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{{ moduleItem.key }}</p>
                </div>
              </div>
              <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">{{ moduleItem.description }}</p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold" :class="moduleItem.installed ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'">
                {{ moduleItem.installed ? '已安装' : '未安装' }}
              </span>
              <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold" :class="moduleItem.enabled ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200'">
                {{ moduleItem.enabled ? '已启用' : '已停用' }}
              </span>
            </div>
          </div>

          <dl class="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/40 sm:grid-cols-2">
            <div class="space-y-1">
              <dt class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">安装时间</dt>
              <dd class="text-slate-600 dark:text-slate-200">{{ formatTimestamp(moduleItem.installedAt) }}</dd>
            </div>
            <div class="space-y-1">
              <dt class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">最近更新</dt>
              <dd class="text-slate-600 dark:text-slate-200">{{ formatTimestamp(moduleItem.updatedAt) }}</dd>
            </div>
          </dl>

          <div class="flex flex-wrap gap-3">
            <UButton
              :to="moduleItem.settingsPath || `/admin/modules/${moduleItem.key}`"
              color="neutral"
              variant="soft"
              icon="i-lucide-settings-2"
              class="justify-center"
            >
              查看详情
            </UButton>

            <button
              v-if="!moduleItem.installed"
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
              :disabled="Boolean(pendingActionKey)"
              @click="submitModuleAction(moduleItem, 'install')"
            >
              <LoaderCircle v-if="pendingActionKey === `${moduleItem.key}:install`" :size="16" class="animate-spin" />
              <Download v-else :size="16" />
              安装模块
            </button>

            <button
              v-else-if="!moduleItem.enabled"
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
              :disabled="Boolean(pendingActionKey)"
              @click="submitModuleAction(moduleItem, 'enable')"
            >
              <LoaderCircle v-if="pendingActionKey === `${moduleItem.key}:enable`" :size="16" class="animate-spin" />
              <Power v-else :size="16" />
              启用模块
            </button>

            <button
              v-else
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
              :disabled="Boolean(pendingActionKey)"
              @click="submitModuleAction(moduleItem, 'disable')"
            >
              <LoaderCircle v-if="pendingActionKey === `${moduleItem.key}:disable`" :size="16" class="animate-spin" />
              <CircleOff v-else :size="16" />
              停用模块
            </button>

            <button
              v-if="moduleItem.installed"
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"
              :disabled="Boolean(pendingActionKey)"
              @click="submitModuleAction(moduleItem, 'uninstall')"
            >
              <LoaderCircle v-if="pendingActionKey === `${moduleItem.key}:uninstall`" :size="16" class="animate-spin" />
              <Trash2 v-else :size="16" />
              卸载模块
            </button>
          </div>
        </div>
      </UCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  AlertCircle,
  CircleOff,
  Download,
  LoaderCircle,
  Package,
  Power,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Trash2,
} from '~/utils/admin-lucide-icons';
import { useAppToast } from '~/composables/useAppToast';
import { resolveRequestErrorMessage } from '~/utils/request-error';
import type { AdminModuleSummary } from '~~/shared/types/module-center';

definePageMeta({ layout: 'admin' });

type ModuleAction = 'install' | 'enable' | 'disable' | 'uninstall';

type LoadState = 'loading' | 'ready' | 'error';

const moduleListEndpoint = '/api/admin/modules';
const featuredModuleKey = 'notification-center';

const modules = ref<AdminModuleSummary[]>([]);
const loadState = ref<LoadState>('loading');
const errorMessage = ref('');
const feedbackMessage = ref('');
const feedbackTone = ref<'success' | 'error'>('success');
const pendingActionKey = ref('');

const { addToast } = useAppToast();

await fetchModules();

async function fetchModules() {
  loadState.value = 'loading';
  errorMessage.value = '';

  try {
    const response = await $fetch<AdminModuleSummary[]>(moduleListEndpoint);
    modules.value = response;
    loadState.value = 'ready';
  }
  catch (error) {
    errorMessage.value = resolveRequestErrorMessage(error, '模块列表读取失败');
    loadState.value = 'error';
  }
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return '尚未记录';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function readActionLabel(action: ModuleAction) {
  if (action === 'install') {
    return '安装模块';
  }

  if (action === 'enable') {
    return '启用模块';
  }

  if (action === 'disable') {
    return '停用模块';
  }

  return '卸载模块';
}

function readActionSuccessMessage(moduleItem: AdminModuleSummary, action: ModuleAction) {
  if (action === 'install') {
    return `${moduleItem.name}已安装并启用`;
  }

  if (action === 'enable') {
    return `${moduleItem.name}已启用`;
  }

  if (action === 'disable') {
    return `${moduleItem.name}已停用`;
  }

  return `${moduleItem.name}已卸载`;
}

async function submitModuleAction(moduleItem: AdminModuleSummary, action: ModuleAction) {
  pendingActionKey.value = `${moduleItem.key}:${action}`;
  feedbackMessage.value = '';

  try {
    await $fetch<AdminModuleSummary>(`${moduleListEndpoint}/${moduleItem.key}/${action}`, {
      method: 'POST',
    });

    const message = readActionSuccessMessage(moduleItem, action);
    feedbackTone.value = 'success';
    feedbackMessage.value = message;
    addToast(message, 'success');
    await fetchModules();
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, `${readActionLabel(action)}失败`);
    feedbackTone.value = 'error';
    feedbackMessage.value = message;
    addToast(message, 'error');
  }
  finally {
    pendingActionKey.value = '';
  }
}

void featuredModuleKey;
</script>

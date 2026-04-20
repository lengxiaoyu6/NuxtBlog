<template>
  <div class="space-y-8 pb-20">
    <section class="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="font-serif text-3xl font-black tracking-tight text-slate-900 dark:text-white">项目展示</h1>
            <span class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold" :class="saveBadgeClass">
              <component :is="saveBadgeIcon" :size="14" :class="saveState === 'saving' ? 'animate-spin' : ''" />
              {{ saveBadgeLabel }}
            </span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ activeTab === 'settings' ? '维护项目展示页面的启用状态、SEO 与空状态文案。' : '维护项目区块标题与项目卡片列表。' }}
          </p>
          <div
            v-if="feedbackMessage"
            class="inline-flex max-w-full items-start gap-2 rounded-2xl border px-4 py-3 text-sm"
            :class="feedbackTone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'"
          >
            <AlertCircle v-if="feedbackTone === 'error'" :size="16" class="mt-0.5 shrink-0" />
            <ShieldCheck v-else :size="16" class="mt-0.5 shrink-0" />
            <span>{{ feedbackMessage }}</span>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 xl:w-[22rem]">
          <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800" :disabled="isActionDisabled" @click="resetForm">
            <RotateCcw :size="16" />
            重置本页
          </button>
          <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300" :disabled="isActionDisabled" @click="savePageSettings">
            <LoaderCircle v-if="saveState === 'saving'" :size="16" class="animate-spin" />
            <Save v-else :size="16" />
            {{ saveState === 'saving' ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </section>

    <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-900/40">
      <button
        type="button"
        class="inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'settings'
          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
        @click="activeTab = 'settings'"
      >
        基础设置
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'projects'
          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
        @click="activeTab = 'projects'"
      >
        <span>项目列表</span>
        <span
          class="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px]"
          :class="activeTab === 'projects'
            ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
            : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-300'"
        >
          {{ form.projects.length }}
        </span>
      </button>
    </div>

    <div v-if="activeTab === 'settings'" class="space-y-8">
      <section class="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
            <Power :size="22" />
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white">页面状态</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">控制项目展示页面是否在前台展示。</p>
          </div>
        </div>
        <label class="flex items-start gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
          <input v-model="form.enabled" type="checkbox" class="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500">
          <div class="space-y-1">
            <p class="text-sm font-bold text-slate-900 dark:text-white">启用项目展示页面</p>
            <p class="text-sm text-slate-500 dark:text-slate-400">关闭后前台导航会移除项目展示入口，直接访问页面时返回 404。</p>
          </div>
        </label>
      </section>

      <section class="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300">
            <SearchCheck :size="22" />
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white">SEO 设置</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">维护页面标题与描述元信息。</p>
          </div>
        </div>
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white">SEO 标题</label>
            <input v-model="form.seo.title" type="text" maxlength="60" class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
          </div>
          <div class="space-y-2 lg:col-span-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white">SEO 描述</label>
            <textarea v-model="form.seo.description" rows="4" maxlength="160" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
          </div>
        </div>
      </section>

      <section class="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Box :size="22" />
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white">空状态</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">当全部项目停用时，前台页面显示该提示文案。</p>
          </div>
        </div>
        <div class="grid gap-4">
          <input v-model="form.emptyState.title" type="text" maxlength="40" placeholder="空状态标题" class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
          <textarea v-model="form.emptyState.description" rows="3" maxlength="120" placeholder="空状态说明" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
        </div>
      </section>
    </div>

    <div v-else class="space-y-8">
      <section class="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div class="mb-6 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <FolderKanban :size="22" />
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">项目列表</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">维护项目卡片的标题、描述、链接与展示状态。</p>
            </div>
          </div>
          <button type="button" class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700" @click="addProject">
            <Plus :size="16" />
            新增项目
          </button>
        </div>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white">区块标题</label>
            <input v-model="form.projectsSection.title" type="text" maxlength="40" class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
          </div>
          <article
            v-for="item in form.projects"
            :key="item.id"
            class="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <input v-model="item.enabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500">
                <p class="text-sm font-bold text-slate-900 dark:text-white">{{ item.title || '未命名项目' }}</p>
              </div>
              <button type="button" class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30" @click="removeProject(item.id)">
                <Trash2 :size="14" />
                删除
              </button>
            </div>
            <div class="grid gap-4 lg:grid-cols-2">
              <input v-model="item.title" type="text" maxlength="50" placeholder="项目标题" class="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
              <input v-model="item.category" type="text" maxlength="30" placeholder="项目分类" class="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
              <input v-model="item.image" type="url" placeholder="封面图片链接" class="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
              <input v-model="item.githubUrl" type="url" placeholder="GitHub 链接" class="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
              <input v-model="item.demoUrl" type="url" placeholder="演示链接" class="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 lg:col-span-2">
              <textarea v-model="item.description" rows="4" maxlength="180" placeholder="项目描述" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 lg:col-span-2" />
              <input v-model="projectTags[item.id]" type="text" placeholder="标签，使用逗号分隔" class="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 lg:col-span-2" @change="syncProjectTags(item.id)">
            </div>
          </article>
        </div>
      </section>
    </div>

    <section class="flex flex-col gap-4 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <p class="text-sm font-bold text-slate-900 dark:text-white">{{ saveBadgeLabel }}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ bottomStatusText }}</p>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800" :disabled="isActionDisabled" @click="resetForm">
          <RotateCcw :size="16" />
          重置本页
        </button>
        <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300" :disabled="isActionDisabled" @click="savePageSettings">
          <LoaderCircle v-if="saveState === 'saving'" :size="16" class="animate-spin" />
          <Save v-else :size="16" />
          {{ saveState === 'saving' ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  AlertCircle,
  Box,
  FolderKanban,
  LoaderCircle,
  Plus,
  Power,
  RotateCcw,
  Save,
  SearchCheck,
  ShieldCheck,
  Trash2,
} from 'lucide-vue-next';
import { clonePageSettings } from '~/constants/page-settings';
import { useAdminPageEditor } from '~/composables/useAdminPageEditor';
import { useAppToast } from '~/composables/useAppToast';
import { usePageSettings } from '~/composables/usePageSettings';
import type { ProjectsPageSettings } from '~/types/page-settings';
import { resolveRequestErrorMessage } from '~/utils/request-error';

definePageMeta({ layout: 'admin' });

const { addToast } = useAppToast();
const { pageSettings, fetchPageSettings } = usePageSettings();
const activeTab = ref<'settings' | 'projects'>('settings');

await fetchPageSettings({ admin: true });

function cloneProjectsPageSettings(value: ProjectsPageSettings): ProjectsPageSettings {
  return clonePageSettings({
    ...pageSettings.value,
    projects: value,
  }).projects;
}

const {
  form,
  saveState,
  feedbackMessage,
  feedbackTone,
  isActionDisabled,
  bottomStatusText,
  resetForm,
  beginSaving,
  markError,
  markSaved,
} = useAdminPageEditor(pageSettings.value.projects, cloneProjectsPageSettings);

const saveBadgeLabel = computed(() => {
  if (saveState.value === 'dirty') {
    return '未保存';
  }

  if (saveState.value === 'saving') {
    return '保存中';
  }

  if (saveState.value === 'error') {
    return '未保存';
  }

  return '已保存';
});

const saveBadgeIcon = computed(() => saveState.value === 'saved' ? ShieldCheck : AlertCircle);

const saveBadgeClass = computed(() => {
  if (saveState.value === 'dirty') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200';
  }

  if (saveState.value === 'saving') {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200';
  }

  if (saveState.value === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200';
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200';
});

const projectTags = reactive<Record<string, string>>(
  Object.fromEntries(form.value.projects.map((item) => [item.id, item.tags.join(', ')]))
);

function addProject() {
  const id = `project-${Date.now()}`;
  form.value.projects.push({
    id,
    title: '',
    description: '',
    image: '',
    category: '',
    tags: [],
    githubUrl: '',
    demoUrl: '',
    enabled: true,
  });
  projectTags[id] = '';
}

function removeProject(id: string) {
  form.value.projects = form.value.projects.filter((item) => item.id !== id);
  delete projectTags[id];
}

function syncProjectTags(id: string) {
  const target = form.value.projects.find((item) => item.id === id);
  if (!target) {
    return;
  }

  target.tags = (projectTags[id] || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    new URL(value);
    return true;
  }
  catch {
    return false;
  }
}

function validateForm() {
  if (form.value.enabled && (!form.value.seo.title.trim() || !form.value.seo.description.trim())) {
    return '启用页面时需填写 SEO 标题和 SEO 描述。';
  }

  if (!form.value.projectsSection.title.trim()) {
    return '请输入项目区块标题。';
  }

  if (!form.value.emptyState.title.trim() || !form.value.emptyState.description.trim()) {
    return '请输入空状态标题和说明。';
  }

  for (const item of form.value.projects) {
    if (!item.title.trim() || !item.description.trim() || !item.image.trim()) {
      return '项目条目需填写标题、描述和图片链接。';
    }

    if (!isValidUrl(item.image) || !isValidUrl(item.githubUrl) || !isValidUrl(item.demoUrl)) {
      return '项目条目的图片、源码或演示链接格式无效。';
    }
  }

  return '';
}

async function savePageSettings() {
  const validationMessage = validateForm();
  if (validationMessage) {
    markError(validationMessage);
    addToast(validationMessage, 'warning');
    return;
  }

  beginSaving();
  try {
    const savedSettings = await $fetch<ProjectsPageSettings>('/api/admin/page-settings/projects', {
      method: 'PUT',
      body: cloneProjectsPageSettings(form.value),
    });
    const nextSettings = clonePageSettings(pageSettings.value);
    nextSettings.projects = cloneProjectsPageSettings(savedSettings);
    pageSettings.value = nextSettings;
    markSaved(nextSettings.projects, '项目展示设置已保存');
    addToast('项目展示设置已保存', 'success');
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '项目展示设置保存失败');
    markError(message);
    addToast(message, 'error');
  }
}
</script>

<template>
  <div class="space-y-8 pb-20">
    <section class="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="font-serif text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              关于我
            </h1>
            <span
              class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold"
              :class="saveBadgeClass"
            >
              <component :is="saveBadgeIcon" :size="14" :class="saveState === 'saving' ? 'animate-spin' : ''" />
              {{ saveBadgeLabel }}
            </span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            维护关于我页面的启用状态、故事段落与技能模块。
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
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            :disabled="isActionDisabled"
            @click="resetForm"
          >
            <RotateCcw :size="16" />
            重置本页
          </button>
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
            :disabled="isActionDisabled"
            @click="savePageSettings"
          >
            <LoaderCircle v-if="saveState === 'saving'" :size="16" class="animate-spin" />
            <Save v-else :size="16" />
            {{ saveState === 'saving' ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div class="mb-6 flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
          <Power :size="22" />
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-900 dark:text-white">页面状态</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">控制关于我页面是否在前台展示与允许访问。</p>
        </div>
      </div>

      <label class="flex items-start gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
        <input
          v-model="form.enabled"
          type="checkbox"
          class="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        >
        <div class="space-y-1">
          <p class="text-sm font-bold text-slate-900 dark:text-white">启用关于我页面</p>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            关闭后前台导航会移除该页面入口，直接访问页面时返回 404。
          </p>
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
          <p class="text-sm text-slate-500 dark:text-slate-400">维护页面标题和描述元信息。</p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-2">
          <label class="text-sm font-bold text-slate-900 dark:text-white">SEO 标题</label>
          <input
            v-model="form.seo.title"
            type="text"
            maxlength="60"
            class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
        </div>
        <div class="space-y-2 lg:col-span-2">
          <label class="text-sm font-bold text-slate-900 dark:text-white">SEO 描述</label>
          <textarea
            v-model="form.seo.description"
            rows="4"
            maxlength="160"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
      </div>
    </section>

    <section class="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div class="mb-6 flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
          <NotebookPen :size="22" />
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-900 dark:text-white">故事文案</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">维护介绍标题、地点标签与正文段落。</p>
        </div>
      </div>

      <div class="space-y-6">
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white">区块标题</label>
            <input
              v-model="form.intro.heading"
              type="text"
              maxlength="40"
              class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
          </div>
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white">地点标签</label>
            <input
              v-model="form.location.label"
              type="text"
              maxlength="20"
              class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">段落列表</h3>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              @click="addIntroParagraph"
            >
              <Plus :size="16" />
              新增段落
            </button>
          </div>

          <article
            v-for="(paragraph, index) in form.intro.paragraphs"
            :key="`paragraph-${index}`"
            class="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div class="mb-3 flex items-center justify-between">
              <p class="text-sm font-bold text-slate-900 dark:text-white">段落 {{ index + 1 }}</p>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
                @click="removeIntroParagraph(index)"
              >
                <Trash2 :size="14" />
                删除
              </button>
            </div>
            <textarea
              v-model="form.intro.paragraphs[index]"
              rows="4"
              maxlength="240"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </article>
        </div>
      </div>
    </section>

    <section class="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Blocks :size="22" />
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white">技能模块</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">维护技能区标题、技能卡片与卡片内的能力项。</p>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700"
          @click="addSkillCard"
        >
          <Plus :size="16" />
          新增卡片
        </button>
      </div>

      <div class="space-y-6">
        <label class="flex items-start gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
          <input
            v-model="form.skillsSection.enabled"
            type="checkbox"
            class="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          >
          <div class="space-y-1">
            <p class="text-sm font-bold text-slate-900 dark:text-white">显示技能板块</p>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              关闭后前台关于我页面隐藏技能板块，当前配置内容仍会保留。
            </p>
          </div>
        </label>

        <div class="space-y-2">
          <label class="text-sm font-bold text-slate-900 dark:text-white">区块标题</label>
          <input
            v-model="form.skillsSection.heading"
            type="text"
            maxlength="40"
            class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
        </div>

        <article
          v-for="(card, cardIndex) in form.skills"
          :key="card.id"
          class="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40"
        >
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-black text-slate-900 dark:text-white">{{ card.title || `技能卡片 ${cardIndex + 1}` }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">维护卡片标题、主题、掌握度和能力项。</p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
              @click="removeSkillCard(card.id)"
            >
              <Trash2 :size="14" />
              删除卡片
            </button>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-900 dark:text-white">卡片标题</label>
              <input
                v-model="card.title"
                type="text"
                maxlength="40"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-900 dark:text-white">副标题</label>
              <input
                v-model="card.subtitle"
                type="text"
                maxlength="50"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-900 dark:text-white">主题</label>
              <select
                v-model="card.theme"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                <option v-for="option in themeOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-900 dark:text-white">掌握度</label>
              <input
                v-model.number="card.level"
                type="number"
                min="0"
                max="100"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
            </div>
            <div class="space-y-2 lg:col-span-2">
              <label class="text-sm font-bold text-slate-900 dark:text-white">描述</label>
              <textarea
                v-model="card.description"
                rows="3"
                maxlength="180"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div class="mt-6 space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">能力项</h4>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                @click="addSkillItem(card.id)"
              >
                <Plus :size="16" />
                新增能力
              </button>
            </div>

            <div class="grid gap-4 lg:grid-cols-2">
              <article
                v-for="item in card.items"
                :key="item.id"
                class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div class="mb-3 flex items-center justify-between">
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ item.name || '未命名能力' }}</p>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    @click="removeSkillItem(card.id, item.id)"
                  >
                    <Trash2 :size="14" />
                    删除
                  </button>
                </div>

                <div class="grid gap-3">
                  <input
                    v-model="item.name"
                    type="text"
                    maxlength="40"
                    placeholder="能力名称"
                    class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                  <input
                    v-model.number="item.level"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="掌握度"
                    class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                </div>
              </article>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="flex flex-col gap-4 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <p class="text-sm font-bold text-slate-900 dark:text-white">{{ saveBadgeLabel }}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ bottomStatusText }}</p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          :disabled="isActionDisabled"
          @click="resetForm"
        >
          <RotateCcw :size="16" />
          重置本页
        </button>
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
          :disabled="isActionDisabled"
          @click="savePageSettings"
        >
          <LoaderCircle v-if="saveState === 'saving'" :size="16" class="animate-spin" />
          <Save v-else :size="16" />
          {{ saveState === 'saving' ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  AlertCircle,
  Blocks,
  LoaderCircle,
  NotebookPen,
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
import { usePageSettings } from '~/composables/usePageSettings';
import { useAppToast } from '~/composables/useAppToast';
import type { AboutPageSettings } from '~/types/page-settings';

definePageMeta({ layout: 'admin' });

const themeOptions = ['blue', 'emerald', 'violet', 'amber'] as const;
const { addToast } = useAppToast();
const { pageSettings, fetchPageSettings } = usePageSettings();

await fetchPageSettings({ admin: true });

function cloneAboutPageSettings(value: AboutPageSettings): AboutPageSettings {
  return clonePageSettings({
    ...pageSettings.value,
    about: value,
  }).about;
}

const editor = useAdminPageEditor(pageSettings.value.about, cloneAboutPageSettings);
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
} = editor;

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

const saveBadgeIcon = computed(() => {
  if (saveState.value === 'saved') {
    return ShieldCheck;
  }

  return AlertCircle;
});

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

function addIntroParagraph() {
  form.value.intro.paragraphs.push('');
}

function removeIntroParagraph(index: number) {
  if (form.value.intro.paragraphs.length <= 1) {
    return;
  }

  form.value.intro.paragraphs.splice(index, 1);
}

function addSkillCard() {
  form.value.skills.push({
    id: `about-skill-${Date.now()}`,
    title: '',
    subtitle: '',
    description: '',
    level: 80,
    theme: 'blue',
    items: [
      {
        id: `about-skill-item-${Date.now()}`,
        name: '',
        level: 80,
      },
    ],
  });
}

function removeSkillCard(id: string) {
  form.value.skills = form.value.skills.filter((item) => item.id !== id);
}

function addSkillItem(cardId: string) {
  const target = form.value.skills.find((item) => item.id === cardId);
  if (!target) {
    return;
  }

  target.items.push({
    id: `about-skill-item-${Date.now()}`,
    name: '',
    level: 80,
  });
}

function removeSkillItem(cardId: string, itemId: string) {
  const target = form.value.skills.find((item) => item.id === cardId);
  if (!target) {
    return;
  }

  target.items = target.items.filter((item) => item.id !== itemId);
}

function validateForm() {
  if (form.value.enabled && (!form.value.seo.title.trim() || !form.value.seo.description.trim())) {
    return '启用页面时需填写 SEO 标题和 SEO 描述。';
  }

  if (!form.value.intro.heading.trim()) {
    return '请输入故事区块标题。';
  }

  if (!form.value.skillsSection.heading.trim()) {
    return '请输入技能区块标题。';
  }

  for (const card of form.value.skills) {
    if (!card.title.trim() || !card.description.trim()) {
      return '技能卡片需填写标题和描述。';
    }

    if (card.level < 0 || card.level > 100) {
      return '技能卡片掌握度需在 0 到 100 之间。';
    }

    if (card.items.length === 0) {
      return '每张技能卡片至少保留一个能力项。';
    }

    for (const item of card.items) {
      if (!item.name.trim()) {
        return '能力项名称不能为空。';
      }

      if (item.level < 0 || item.level > 100) {
        return '能力项掌握度需在 0 到 100 之间。';
      }
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
    const savedSettings = await $fetch<AboutPageSettings>('/api/admin/page-settings/about', {
      method: 'PUT',
      body: cloneAboutPageSettings(form.value),
    });
    const nextSettings = clonePageSettings(pageSettings.value);
    nextSettings.about = cloneAboutPageSettings(savedSettings);
    pageSettings.value = nextSettings;
    markSaved(nextSettings.about);
    addToast('关于我页面设置已保存', 'success');
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '关于我页面设置保存失败';
    markError(message);
    addToast(message, 'error');
  }
}
</script>

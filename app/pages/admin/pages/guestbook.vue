<template>
  <div class="space-y-8 pb-20">
    <UCard :ui="{ root: 'rounded-[2rem] border-slate-200 dark:border-slate-800', body: 'p-5 sm:p-6' }">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <UIcon name="i-lucide-message-circle-more" class="size-7 text-brand-600 dark:text-brand-300" />
            <h1 class="font-serif text-3xl font-black tracking-tight text-slate-900 dark:text-white">留言板</h1>
            <span class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold" :class="saveBadgeClass">
              <component :is="saveBadgeIcon" :size="14" :class="saveState === 'saving' ? 'animate-spin' : ''" />
              {{ saveBadgeLabel }}
            </span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ activeTab === 'settings' ? '维护留言板页面的启用状态与留言区说明。' : '审核服务端留言记录与回复。' }}
          </p>
          <div
            v-if="activeTab === 'settings' && feedbackMessage"
            class="inline-flex max-w-full items-start gap-2 rounded-2xl border px-4 py-3 text-sm"
            :class="feedbackTone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'"
          >
            <AlertCircle v-if="feedbackTone === 'error'" :size="16" class="mt-0.5 shrink-0" />
            <ShieldCheck v-else :size="16" class="mt-0.5 shrink-0" />
            <span>{{ feedbackMessage }}</span>
          </div>
          <div
            v-else-if="activeTab === 'comments'"
            class="inline-flex max-w-full items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300"
          >
            <MessageSquareText :size="16" class="mt-0.5 shrink-0" />
            <span>当前审核列表读取服务端留言数据，回复与主留言统一纳入审核。</span>
          </div>
        </div>

        <div v-if="activeTab === 'settings'" class="grid gap-3 sm:grid-cols-2 xl:w-[22rem]">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-rotate-ccw"
            class="justify-center"
            :disabled="isActionDisabled"
            @click="resetForm"
          >
            重置本页
          </UButton>
          <UButton
            :loading="saveState === 'saving'"
            :icon="saveState === 'saving' ? undefined : 'i-lucide-save'"
            class="justify-center"
            :disabled="isActionDisabled"
            @click="savePageSettings"
          >
            {{ saveState === 'saving' ? '保存中...' : '保存修改' }}
          </UButton>
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2 xl:w-[22rem]">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-rotate-ccw"
            class="justify-center"
            @click="refreshGuestbookComments"
          >
            刷新列表
          </UButton>
          <div class="flex h-11 items-center justify-center rounded-xl bg-amber-50 px-4 text-sm font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
            待审核 {{ statusCounts.pending }}
          </div>
        </div>
      </div>
    </UCard>

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
        :class="activeTab === 'comments'
          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
        @click="activeTab = 'comments'"
      >
        <span>留言板列表</span>
        <span
          class="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px]"
          :class="activeTab === 'comments'
            ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
            : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-300'"
        >
          {{ statusCounts.all }}
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
            <p class="text-sm text-slate-500 dark:text-slate-400">控制留言板页面是否在前台展示。</p>
          </div>
        </div>
        <label class="flex items-start gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
          <input v-model="form.enabled" type="checkbox" class="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500">
          <div class="space-y-1">
            <p class="text-sm font-bold text-slate-900 dark:text-white">启用留言板页面</p>
            <p class="text-sm text-slate-500 dark:text-slate-400">关闭后前台导航会移除留言板入口，直接访问页面时返回 404。</p>
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
            <MessagesSquare :size="22" />
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white">留言区说明</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">维护留言墙标题和补充说明。</p>
          </div>
        </div>
        <div class="grid gap-6">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white">区块标题</label>
            <input v-model="form.commentSection.title" type="text" maxlength="40" class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
          </div>
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white">补充说明</label>
            <textarea v-model="form.commentSection.description" rows="3" maxlength="120" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
          </div>
        </div>
      </section>

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

    <div v-else class="space-y-8">
      <div class="grid gap-4 sm:grid-cols-2 xl:w-[30rem]">
        <div class="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-400">留言总量</p>
              <p class="mt-3 text-3xl font-black text-slate-900 dark:text-white">{{ statusCounts.all }}</p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <MessageSquareText :size="22" />
            </div>
          </div>
        </div>

        <div class="rounded-[2rem] border border-amber-200/80 bg-amber-50/80 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.28em] text-amber-600 dark:text-amber-300">待审核总数</p>
              <p class="mt-3 text-3xl font-black text-amber-700 dark:text-amber-100">{{ statusCounts.pending }}</p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-amber-600 shadow-sm dark:bg-amber-900/30 dark:text-amber-200">
              <Clock3 :size="22" />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800/60 dark:bg-slate-900/30">
        <button
          v-for="status in commentStatuses"
          :key="status.id"
          type="button"
          class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all"
          :class="activeStatus === status.id
            ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
          @click="activeStatus = status.id"
        >
          <span>{{ status.label }}</span>
          <span
            class="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px]"
            :class="activeStatus === status.id
              ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
              : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-300'"
          >
            {{ statusCounts[status.id] }}
          </span>
        </button>
      </div>

      <div class="space-y-4 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div class="relative flex-1">
            <Search class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" :size="16" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索留言内容、作者或回复对象"
              class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950"
            >
          </div>

          <label class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <ArrowUpDown :size="16" />
            <span>排序</span>
            <select
              v-model="sortOrder"
              class="h-11 min-w-[8rem] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-all focus:border-brand-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="newest">最新优先</option>
              <option value="oldest">最早优先</option>
            </select>
          </label>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400">当前列表展示服务端留言记录，回复与主留言共用同一审核列表。</p>
      </div>

      <div class="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div v-if="filteredComments.length > 0" class="overflow-x-auto">
          <table class="min-w-[980px] w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th class="px-6 py-4">状态</th>
                <th class="px-4 py-4">留言内容</th>
                <th class="px-4 py-4">留言来源</th>
                <th class="px-4 py-4">作者信息</th>
                <th class="px-4 py-4">提交时间</th>
                <th class="px-8 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-800/70">
              <tr
                v-for="comment in filteredComments"
                :key="comment.id"
                class="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/20"
                :class="comment.status === 'pending' ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''"
              >
                <td class="px-6 py-6 align-top">
                  <span
                    class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
                    :class="statusBadgeClassMap[comment.status]"
                  >
                    <component :is="statusIconMap[comment.status]" :size="14" />
                    {{ statusLabelMap[comment.status] }}
                  </span>
                </td>
                <td class="px-4 py-6 align-top">
                  <div class="space-y-2">
                    <p v-if="comment.replyToSummary" class="text-xs font-medium text-brand-600 dark:text-brand-300">回复给：{{ comment.replyToSummary }}</p>
                    <p class="max-w-xl text-sm leading-6 text-slate-700 line-clamp-2 dark:text-slate-200">
                      {{ comment.content }}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-6 align-top">
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ comment.articleTitle }}</p>
                      <p class="mt-1 text-xs text-slate-400">来源：服务端记录</p>
                </td>
                <td class="px-4 py-6 align-top">
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ comment.authorName }}</p>
                  <p class="mt-1 text-xs text-slate-400">{{ comment.authorRegion }}</p>
                </td>
                <td class="px-4 py-6 align-top text-sm text-slate-500 dark:text-slate-400">
                  {{ comment.submittedAt }}
                </td>
                <td class="px-8 py-6 align-top">
                  <div class="flex justify-end gap-2">
                    <button
                      v-for="action in availableActions[comment.status]"
                      :key="`${comment.id}-${action}`"
                      type="button"
                      class="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
                      :class="actionButtonClassMap[action]"
                      @click="handleAction(comment.id, action)"
                    >
                      {{ actionLabels[action] }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <MessageSquareText :size="24" />
          </div>
          <p class="mt-6 text-base font-bold text-slate-900 dark:text-white">{{ getEmptyStateMessage() }}</p>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">调整状态、关键词或排序后可重新查看留言列表。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AlertCircle,
  ArrowUpDown,
  CheckCheck,
  Clock3,
  LoaderCircle,
  MessagesSquare,
  MessageSquareText,
  Power,
  RotateCcw,
  Save,
  Search,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from '~/utils/admin-lucide-icons';
import { clonePageSettings } from '~/constants/page-settings';
import { useAdminPageEditor } from '~/composables/useAdminPageEditor';
import { useAppToast } from '~/composables/useAppToast';
import { usePageSettings } from '~/composables/usePageSettings';
import type { AdminComment, AdminCommentAction, AdminCommentStatus } from '~/types/admin-comment';
import type { GuestbookPageSettings } from '~/types/page-settings';
import { resolveRequestErrorMessage } from '~/utils/request-error';

definePageMeta({ layout: 'admin' });

const { addToast } = useAppToast();
const { pageSettings, fetchPageSettings } = usePageSettings();

await fetchPageSettings({ admin: true });

type CommentStatusFilter = 'all' | AdminCommentStatus;

const activeTab = ref<'settings' | 'comments'>('settings');
const guestbookComments = ref<AdminComment[]>([]);
const searchQuery = ref('');
const activeStatus = ref<CommentStatusFilter>('all');
const sortOrder = ref<'newest' | 'oldest'>('newest');

const commentStatuses = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待审核' },
  { id: 'approved', label: '已通过' },
  { id: 'rejected', label: '已拒绝' },
  { id: 'spam', label: '垃圾留言' },
] as const satisfies ReadonlyArray<{ id: CommentStatusFilter; label: string }>;

const statusLabelMap: Record<AdminCommentStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  spam: '垃圾留言',
};

const statusBadgeClassMap: Record<AdminCommentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200',
  spam: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

const statusIconMap = {
  pending: Clock3,
  approved: CheckCheck,
  rejected: XCircle,
  spam: ShieldAlert,
} satisfies Record<AdminCommentStatus, typeof Clock3>;

const actionLabels: Record<AdminCommentAction, string> = {
  approve: '通过',
  reject: '拒绝',
  'mark-spam': '标记垃圾',
};

const actionButtonClassMap: Record<AdminCommentAction, string> = {
  approve: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-900/40',
  reject: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/40',
  'mark-spam': 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-900/40',
};

function cloneGuestbookPageSettings(value: GuestbookPageSettings): GuestbookPageSettings {
  return clonePageSettings({
    ...pageSettings.value,
    guestbook: value,
  }).guestbook;
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
} = useAdminPageEditor(pageSettings.value.guestbook, cloneGuestbookPageSettings);

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

const statusCounts = computed(() => {
  const counts: Record<CommentStatusFilter, number> = {
    all: guestbookComments.value.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    spam: 0,
  };

  for (const comment of guestbookComments.value) {
    counts[comment.status] += 1;
  }

  return counts;
});

const filteredComments = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  const results = guestbookComments.value.filter((comment) => {
    const matchesStatus = activeStatus.value === 'all' || comment.status === activeStatus.value;
    const haystack = [comment.content, comment.authorName, comment.replyToSummary ?? ''].join(' ').toLowerCase();
    const matchesKeyword = keyword.length === 0 || haystack.includes(keyword);

    return matchesStatus && matchesKeyword;
  });

  return [...results].sort((left, right) => {
    return sortOrder.value === 'newest'
      ? right.submittedAt.localeCompare(left.submittedAt)
      : left.submittedAt.localeCompare(right.submittedAt);
  });
});

const availableActions = computed<Record<string, AdminCommentAction[]>>(() => ({
  pending: ['approve', 'reject', 'mark-spam'],
  approved: ['reject', 'mark-spam'],
  rejected: ['approve', 'mark-spam'],
  spam: ['approve', 'reject'],
}));

async function refreshGuestbookComments() {
  guestbookComments.value = await $fetch<AdminComment[]>('/api/admin/guestbook/comments').catch(() => []);
}

function handleAction(commentId: string, action: AdminCommentAction) {
  if (action === 'approve') {
    void updateCommentStatus(commentId, 'approved');
    return;
  }

  if (action === 'reject') {
    void updateCommentStatus(commentId, 'rejected');
    return;
  }

  void updateCommentStatus(commentId, 'spam');
}

async function updateCommentStatus(commentId: string, nextStatus: AdminCommentStatus) {
  try {
    const updatedComment = await $fetch<AdminComment>(`/api/admin/guestbook/comments/${commentId}/status`, {
      method: 'PATCH',
      body: {
        status: nextStatus,
      },
    });

    guestbookComments.value = guestbookComments.value.map((item) =>
      item.id === commentId ? updatedComment : item,
    );

    if (nextStatus === 'approved') {
      addToast('留言已通过', 'success');
      return;
    }

    if (nextStatus === 'rejected') {
      addToast('留言已拒绝', 'warning');
      return;
    }

    addToast('已标记为垃圾留言', 'error');
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '留言状态更新失败');
    addToast(message, 'error');
  }
}

function getEmptyStateMessage() {
  if (searchQuery.value.trim()) {
    return '当前关键词下没有匹配留言';
  }

  if (activeStatus.value === 'pending') {
    return '当前没有待处理留言';
  }

  if (activeStatus.value === 'spam') {
    return '当前没有已标记的垃圾留言';
  }

  return '当前没有留言记录';
}

function validateForm() {
  if (form.value.enabled && (!form.value.seo.title.trim() || !form.value.seo.description.trim())) {
    return '启用页面时需填写 SEO 标题和 SEO 描述。';
  }

  if (!form.value.commentSection.title.trim()) {
    return '请输入留言区标题。';
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
    const savedSettings = await $fetch<GuestbookPageSettings>('/api/admin/page-settings/guestbook', {
      method: 'PUT',
      body: cloneGuestbookPageSettings(form.value),
    });
    const nextSettings = clonePageSettings(pageSettings.value);
    nextSettings.guestbook = cloneGuestbookPageSettings(savedSettings);
    pageSettings.value = nextSettings;
    markSaved(nextSettings.guestbook, '留言板设置已保存');
    addToast('留言板设置已保存', 'success');
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '留言板设置保存失败');
    markError(message);
    addToast(message, 'error');
  }
}

await refreshGuestbookComments();
</script>

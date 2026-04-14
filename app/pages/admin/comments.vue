<template>
  <div class="space-y-8 pb-20">
    <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <h1 class="text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
            评论管理
          </h1>
          <div class="hidden sm:flex items-center px-2.5 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg border border-brand-100 dark:border-brand-800/50">
            <span class="text-[10px] font-black uppercase tracking-widest mr-1.5 opacity-70">Total</span>
            <span class="text-sm font-black">{{ statusCounts.all }}</span>
          </div>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400">集中处理评论状态与审核事项</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:w-[30rem]">
        <div class="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-400">评论总量</p>
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

    <div class="flex flex-col gap-4 rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" :size="16" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索评论、作者或文章标题"
          class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950"
        >
      </div>

      <div class="flex flex-col gap-4 sm:flex-row lg:items-center">
        <label class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Filter :size="16" />
          <span>文章</span>
          <select
            v-model="activeArticleId"
            class="h-11 min-w-[12rem] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-all focus:border-brand-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            <option v-for="article in articleOptions" :key="article.value" :value="article.value">
              {{ article.label }}
            </option>
          </select>
        </label>

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
    </div>

    <div class="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div v-if="filteredComments.length > 0" class="overflow-x-auto">
        <table class="min-w-[980px] w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th class="px-6 py-4">状态</th>
              <th class="px-4 py-4">评论内容</th>
              <th class="px-4 py-4">所属文章</th>
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
                  <p v-if="comment.replyToSummary" class="text-xs font-medium text-brand-600 dark:text-brand-300">
                    回复给：{{ comment.replyToSummary }}
                  </p>
                  <p class="max-w-xl text-sm leading-6 text-slate-700 line-clamp-2 dark:text-slate-200">
                    {{ comment.content }}
                  </p>
                </div>
              </td>
              <td class="px-4 py-6 align-top">
                <p class="text-sm font-bold text-slate-900 dark:text-white">{{ comment.articleTitle }}</p>
                <p class="mt-1 text-xs text-slate-400">文章编号：{{ comment.articleId }}</p>
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
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">调整状态、文章或关键词后可重新查看评论列表。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ArrowUpDown,
  Ban,
  CheckCheck,
  Clock3,
  Filter,
  MessageSquareText,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-vue-next';
import { useAppToast } from '~/composables/useAppToast';
import type { AdminComment, AdminCommentAction, AdminCommentStatus } from '~/types/admin-comment';

definePageMeta({
  layout: 'admin',
});

const { addToast } = useAppToast();

type CommentStatusFilter = 'all' | AdminCommentStatus;

const commentStatuses = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待审核' },
  { id: 'approved', label: '已通过' },
  { id: 'rejected', label: '已拒绝' },
  { id: 'spam', label: '垃圾评论' },
] as const satisfies ReadonlyArray<{ id: CommentStatusFilter; label: string }>;

const statusLabelMap: Record<AdminCommentStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  spam: '垃圾评论',
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

const searchQuery = ref('');
const activeStatus = ref<CommentStatusFilter>('all');
const activeArticleId = ref('all');
const sortOrder = ref<'newest' | 'oldest'>('newest');

const comments = ref<AdminComment[]>([]);

const statusCounts = computed(() => {
  const counts: Record<CommentStatusFilter, number> = {
    all: comments.value.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    spam: 0,
  };

  for (const comment of comments.value) {
    counts[comment.status] += 1;
  }

  return counts;
});

const articleOptions = computed(() => [
  { label: '全部文章', value: 'all' },
  ...comments.value.reduce<{ label: string; value: string }[]>((items, comment) => {
    if (items.some((item) => item.value === comment.articleId)) {
      return items;
    }

    return [...items, { label: comment.articleTitle, value: comment.articleId }];
  }, []),
]);

const filteredComments = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  const results = comments.value.filter((comment) => {
    const matchesStatus = activeStatus.value === 'all' || comment.status === activeStatus.value;
    const matchesArticle = activeArticleId.value === 'all' || comment.articleId === activeArticleId.value;
    const haystack = [comment.content, comment.authorName, comment.articleTitle].join(' ').toLowerCase();
    const matchesKeyword = keyword.length === 0 || haystack.includes(keyword);

    return matchesStatus && matchesArticle && matchesKeyword;
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

async function refreshComments() {
  comments.value = await $fetch<AdminComment[]>('/api/admin/post-comments').catch(() => []);
}

async function updateCommentStatus(commentId: string, nextStatus: AdminCommentStatus) {
  try {
    const updatedComment = await $fetch<AdminComment>(`/api/admin/post-comments/${commentId}/status`, {
      method: 'PATCH',
      body: {
        status: nextStatus,
      },
    });

    comments.value = comments.value.map((item) =>
      item.id === commentId ? updatedComment : item,
    );

    if (nextStatus === 'approved') {
      addToast('评论已通过', 'success');
      return;
    }

    if (nextStatus === 'rejected') {
      addToast('评论已拒绝', 'warning');
      return;
    }

    addToast('已标记为垃圾评论', 'error');
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '评论状态更新失败';
    addToast(message, 'error');
  }
}

function getEmptyStateMessage() {
  if (searchQuery.value.trim() || activeArticleId.value !== 'all') {
    return '当前筛选条件下没有匹配评论';
  }

  if (activeStatus.value === 'pending') {
    return '当前没有待处理评论';
  }

  if (activeStatus.value === 'spam') {
    return '当前没有已标记的垃圾评论';
  }

  return '当前没有评论记录';
}

await refreshComments();
</script>

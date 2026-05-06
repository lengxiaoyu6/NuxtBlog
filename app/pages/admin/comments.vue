<template>
  <div class="space-y-6 pb-20">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UCard v-for="item in commentStats" :key="item.label" :ui="cardUi">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ item.label }}</p>
            <p class="mt-2 text-3xl font-black text-slate-900 dark:text-white">{{ item.value }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-2xl" :class="item.bg">
            <UIcon :name="item.icon" class="size-5 text-white" />
          </div>
        </div>
      </UCard>
    </div>

    <UCard :ui="{ ...cardUi, body: 'p-0' }">
      <template #header>
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div class="space-y-2">
            <h1 class="font-serif text-3xl font-black tracking-tight text-slate-900 dark:text-white">评论管理</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">集中处理评论状态、文章筛选与审核操作。</p>
          </div>
          <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto] xl:w-[46rem]">
            <UInput v-model="searchQuery" icon="i-lucide-search" size="lg" placeholder="搜索评论、作者或文章" />
            <USelectMenu
              v-model="activeArticleId"
              :items="articleOptions"
              value-key="value"
              label-key="label"
              icon="i-lucide-filter"
              placeholder="全部文章"
            />
            <UButton
              color="neutral"
              variant="soft"
              size="lg"
              :icon="sortOrder === 'newest' ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-up-wide-narrow'"
              class="justify-center"
              @click="sortOrder = sortOrder === 'newest' ? 'oldest' : 'newest'"
            >
              {{ sortOrder === 'newest' ? '最新' : '最早' }}
            </UButton>
          </div>
        </div>
      </template>

      <div class="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            v-for="status in commentStatuses"
            :key="status.id"
            :color="activeStatus === status.id ? 'primary' : 'neutral'"
            :variant="activeStatus === status.id ? 'solid' : 'soft'"
            size="sm"
            @click="activeStatus = status.id"
          >
            {{ status.label }}
            <template #trailing>
              <UBadge :color="activeStatus === status.id ? 'primary' : 'neutral'" variant="soft" size="xs">
                {{ statusCounts[status.id] }}
              </UBadge>
            </template>
          </UButton>
        </div>
      </div>

      <template v-if="filteredComments.length > 0">
        <div class="hidden overflow-x-auto lg:block">
          <table class="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                <th class="px-6 py-4">状态</th>
                <th class="px-4 py-4">评论内容</th>
                <th class="px-4 py-4">文章</th>
                <th class="px-4 py-4">访客</th>
                <th class="px-4 py-4">提交时间</th>
                <th class="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-800/70">
              <tr v-for="comment in filteredComments" :key="comment.id" class="hover:bg-slate-50/70 dark:hover:bg-slate-900/50">
                <td class="px-6 py-5 align-top">
                  <UBadge :color="statusColorMap[comment.status]" variant="soft">
                    <UIcon :name="statusIconMap[comment.status]" class="mr-1 size-3" />
                    {{ statusLabelMap[comment.status] }}
                  </UBadge>
                </td>
                <td class="px-4 py-5 align-top">
                  <div class="space-y-2">
                    <p v-if="comment.replyToSummary" class="text-xs font-medium text-brand-600 dark:text-brand-300">
                      回复给：{{ comment.replyToSummary }}
                    </p>
                    <p class="max-w-xl text-sm leading-6 text-slate-700 line-clamp-2 dark:text-slate-200">{{ comment.content }}</p>
                  </div>
                </td>
                <td class="px-4 py-5 align-top">
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ comment.articleTitle }}</p>
                  <p class="mt-1 text-xs text-slate-400">文章编号：{{ comment.articleId }}</p>
                </td>
                <td class="px-4 py-5 align-top">
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ comment.authorName }}</p>
                  <p class="mt-1 text-xs text-slate-400">{{ comment.authorRegion }}</p>
                </td>
                <td class="px-4 py-5 align-top text-sm text-slate-500 dark:text-slate-400">{{ comment.submittedAt }}</td>
                <td class="px-6 py-5 align-top">
                  <div class="flex justify-end gap-2">
                    <UButton
                      v-for="action in availableActions[comment.status]"
                      :key="`${comment.id}-${action}`"
                      :color="actionColorMap[action]"
                      variant="soft"
                      size="sm"
                      @click="handleAction(comment.id, action)"
                    >
                      {{ actionLabels[action] }}
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800 lg:hidden">
          <article v-for="comment in filteredComments" :key="comment.id" class="space-y-4 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 space-y-1">
                <p class="text-sm font-bold text-slate-900 dark:text-white">{{ comment.authorName }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ comment.articleTitle }}</p>
              </div>
              <UBadge :color="statusColorMap[comment.status]" variant="soft">
                {{ statusLabelMap[comment.status] }}
              </UBadge>
            </div>
            <p v-if="comment.replyToSummary" class="rounded-2xl bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
              回复给：{{ comment.replyToSummary }}
            </p>
            <p class="text-sm leading-6 text-slate-700 dark:text-slate-200">{{ comment.content }}</p>
            <div class="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>{{ comment.submittedAt }}</span>
              <span>{{ comment.authorRegion }}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="action in availableActions[comment.status]"
                :key="`${comment.id}-${action}-mobile`"
                :color="actionColorMap[action]"
                variant="soft"
                size="sm"
                @click="handleAction(comment.id, action)"
              >
                {{ actionLabels[action] }}
              </UButton>
            </div>
          </article>
        </div>
      </template>

      <div v-else class="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-500">
          <UIcon name="i-lucide-message-square-text" class="size-7" />
        </div>
        <p class="mt-6 text-base font-bold text-slate-900 dark:text-white">{{ getEmptyStateMessage() }}</p>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">调整状态、文章或关键词后可重新查看评论列表。</p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppToast } from '~/composables/useAppToast';
import type { AdminComment, AdminCommentAction, AdminCommentStatus } from '~/types/admin-comment';
import { resolveRequestErrorMessage } from '~/utils/request-error';

definePageMeta({
  layout: 'admin',
});

const { addToast } = useAppToast();

const cardUi = { root: 'rounded-[1.75rem] border-slate-200 dark:border-slate-800 overflow-hidden', body: 'p-5 sm:p-6' };

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

const statusColorMap: Record<AdminCommentStatus, 'warning' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  spam: 'neutral',
};

const statusIconMap: Record<AdminCommentStatus, string> = {
  pending: 'i-lucide-clock-3',
  approved: 'i-lucide-check-check',
  rejected: 'i-lucide-x-circle',
  spam: 'i-lucide-shield-alert',
};

const actionLabels: Record<AdminCommentAction, string> = {
  approve: '通过',
  reject: '拒绝',
  'mark-spam': '标记垃圾',
};

const actionColorMap: Record<AdminCommentAction, 'success' | 'warning' | 'error'> = {
  approve: 'success',
  reject: 'warning',
  'mark-spam': 'error',
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

const commentStats = computed(() => [
  { label: '全部评论', value: statusCounts.value.all, icon: 'i-lucide-message-square-text', bg: 'bg-slate-600' },
  { label: '待审核', value: statusCounts.value.pending, icon: 'i-lucide-clock-3', bg: 'bg-amber-500' },
  { label: '已通过', value: statusCounts.value.approved, icon: 'i-lucide-check-check', bg: 'bg-emerald-500' },
  { label: '垃圾评论', value: statusCounts.value.spam, icon: 'i-lucide-shield-alert', bg: 'bg-rose-500' },
]);

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
    const message = resolveRequestErrorMessage(error, '评论状态更新失败');
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

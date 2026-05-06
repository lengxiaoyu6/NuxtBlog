<template>
  <div class="space-y-6 pb-20">
    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UCard v-for="stat in stats" :key="stat.label" :ui="cardUi">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ stat.label }}</p>
            <p class="mt-2 text-3xl font-black text-slate-900 dark:text-white">{{ stat.value }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-2xl" :class="stat.color">
            <UIcon :name="stat.icon" class="size-5 text-white" />
          </div>
        </div>
      </UCard>
    </section>

    <section class="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <UCard :ui="panelUi" class="order-last lg:order-first">
        <template #header>
          <div>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">快捷操作</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">常用管理功能入口</p>
          </div>
        </template>

        <div class="grid gap-3">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.label"
            :to="action.link"
            class="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 text-left transition-all hover:bg-brand-50 dark:bg-slate-800/50 dark:hover:bg-brand-900/20"
          >
            <div class="grid size-11 place-items-center rounded-xl text-white" :class="action.color">
              <UIcon :name="action.icon" class="size-5" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-slate-900 dark:text-white">{{ action.label }}</p>
              <p class="truncate text-xs text-slate-500 dark:text-slate-400">{{ action.desc }}</p>
            </div>
          </NuxtLink>
        </div>
      </UCard>

      <UCard :ui="{ ...panelUi, body: 'p-0' }">
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-black text-slate-900 dark:text-white">最近文章</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">最近更新的内容记录</p>
            </div>
            <UButton to="/admin/posts" color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-right">
              查看全部
            </UButton>
          </div>
        </template>

        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[720px] text-left">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th class="px-6 py-4">标题</th>
                <th class="px-4 py-4">日期</th>
                <th class="px-4 py-4">状态</th>
                <th class="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-800/70">
              <tr v-for="post in recentPosts" :key="post.id" class="hover:bg-slate-50/70 dark:hover:bg-slate-800/20">
                <td class="px-6 py-4">
                  <p class="max-w-md truncate text-sm font-bold text-slate-900 dark:text-white">{{ post.title }}</p>
                </td>
                <td class="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">{{ post.updatedAt }}</td>
                <td class="px-4 py-4">
                  <UBadge :color="post.status === 'published' ? 'success' : 'warning'" variant="soft">
                    {{ post.status === 'published' ? '已发布' : '草稿' }}
                  </UBadge>
                </td>
                <td class="px-6 py-4 text-right">
                  <UButton
                    :to="{ path: '/admin/posts/new', query: { id: post.id } }"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-pencil"
                    aria-label="编辑文章"
                  />
                </td>
              </tr>
              <tr v-if="recentPosts.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">暂无文章记录</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
          <article v-for="post in recentPosts" :key="post.id" class="space-y-3 p-4">
            <div class="flex items-start justify-between gap-3">
              <h3 class="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">{{ post.title }}</h3>
              <UBadge :color="post.status === 'published' ? 'success' : 'warning'" variant="soft">
                {{ post.status === 'published' ? '已发布' : '草稿' }}
              </UBadge>
            </div>
            <div class="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>{{ post.updatedAt }}</span>
              <UButton
                :to="{ path: '/admin/posts/new', query: { id: post.id } }"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-pencil"
              >
                编辑
              </UButton>
            </div>
          </article>
          <div v-if="recentPosts.length === 0" class="p-10 text-center text-sm text-slate-500 dark:text-slate-400">暂无文章记录</div>
        </div>
      </UCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AdminDashboardSummary } from '~/types/post';

definePageMeta({
  layout: 'admin',
});

const compactNumberFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const cardUi = { root: 'rounded-[1.75rem] border-slate-200 dark:border-slate-800', body: 'p-5 sm:p-6' };
const panelUi = { root: 'rounded-[2rem] border-slate-200 dark:border-slate-800 overflow-hidden', body: 'p-5 sm:p-6' };

function createEmptyDashboardSummary(): AdminDashboardSummary {
  return {
    stats: {
      totalPosts: 0,
      totalComments: 0,
      totalViews: 0,
      pendingComments: 0,
    },
    recentPosts: [],
  };
}

function formatStatValue(value: number) {
  if (value < 1000) {
    return String(value);
  }

  return compactNumberFormatter.format(value).toLowerCase();
}

const { data: dashboard } = await useAsyncData<AdminDashboardSummary>('admin-dashboard-summary', async () => {
  return await $fetch('/api/admin/dashboard');
}, {
  default: createEmptyDashboardSummary,
});

const stats = computed(() => [
  { label: '总文章', value: formatStatValue(dashboard.value.stats.totalPosts), icon: 'i-lucide-file-text', color: 'bg-blue-500' },
  { label: '总评论', value: formatStatValue(dashboard.value.stats.totalComments), icon: 'i-lucide-message-square', color: 'bg-purple-500' },
  { label: '总阅读', value: formatStatValue(dashboard.value.stats.totalViews), icon: 'i-lucide-eye', color: 'bg-brand-600' },
  { label: '待审核评论', value: formatStatValue(dashboard.value.stats.pendingComments), icon: 'i-lucide-clock-3', color: 'bg-orange-500' },
]);

const recentPosts = computed(() => dashboard.value.recentPosts);

const quickActions = [
  { label: '发布文章', desc: '撰写并发布新内容', icon: 'i-lucide-plus', color: 'bg-brand-600', link: '/admin/posts/new' },
  { label: '上传媒体', desc: '管理图片与文件', icon: 'i-lucide-image', color: 'bg-blue-500', link: '/admin/media' },
  { label: '站点预览', desc: '查看前端显示效果', icon: 'i-lucide-external-link', color: 'bg-purple-500', link: '/' },
  { label: '偏好设置', desc: '调整后台管理选项', icon: 'i-lucide-settings', color: 'bg-slate-600', link: '/admin/settings' },
];
</script>

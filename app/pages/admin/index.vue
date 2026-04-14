<template>
  <div class="space-y-8">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div v-for="stat in stats" :key="stat.label" class="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4">
        <div :class="[stat.color, 'p-3 sm:p-4 rounded-xl sm:rounded-2xl']">
          <component :is="stat.icon" class="text-white w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <p class="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{{ stat.label }}</p>
          <p class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-serif mt-0.5 sm:mt-1">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Quick Actions (Left Side) -->
      <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col order-last lg:order-first">
        <h2 class="text-xl font-black text-slate-900 dark:text-white font-serif mb-6">快捷操作</h2>
        <div class="grid grid-cols-1 gap-4 flex-grow">
          <NuxtLink v-for="action in quickActions" :key="action.label" :to="action.link" class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-brand-50 dark:hover:bg-brand-900/20 group transition-all text-left">
            <div :class="[action.color, 'p-3 rounded-xl text-white group-hover:scale-110 transition-transform']">
              <component :is="action.icon" :size="20" />
            </div>
            <div>
              <p class="font-bold text-slate-900 dark:text-white text-sm">{{ action.label }}</p>
              <p class="text-xs text-slate-500">{{ action.desc }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Recent Activity (Right Side) -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col min-w-0">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-black text-slate-900 dark:text-white font-serif">最近文章</h2>
          <NuxtLink to="/admin/posts" class="text-sm font-bold text-brand-600 hover:underline shrink-0">查看全部</NuxtLink>
        </div>
        
        <div class="overflow-x-auto -mx-8 px-8 pb-4 scroll-smooth custom-scrollbar" style="-webkit-overflow-scrolling: touch;">
          <table class="w-full text-center">
            <thead>
              <tr class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th class="pb-4 px-2 text-left whitespace-nowrap">标题</th>
                <th class="pb-4 px-2 whitespace-nowrap">日期</th>
                <th class="pb-4 px-2 whitespace-nowrap">状态</th>
                <th class="pb-4 px-2 whitespace-nowrap text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-800/50">
              <tr v-for="post in recentPosts" :key="post.id" class="group">
                <td class="py-4 px-2 text-left min-w-[150px] max-w-[200px] sm:max-w-xs transition-colors group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/20">
                  <div class="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors cursor-pointer text-sm truncate">
                    {{ post.title }}
                  </div>
                </td>
                <td class="py-4 px-2 text-slate-500 text-sm whitespace-nowrap">{{ post.updatedAt }}</td>
                <td class="py-4 px-2 whitespace-nowrap">
                  <span :class="[
                    post.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600',
                    'px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-block'
                  ]">
                    {{ post.status === 'published' ? '已发布' : '草稿' }}
                  </span>
                </td>
                <td class="py-4 px-2 whitespace-nowrap text-right transition-colors group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/20">
                  <NuxtLink
                    :to="{ path: '/admin/posts/new', query: { id: post.id } }"
                    class="p-2 text-slate-400 hover:text-brand-600 transition-colors inline-block"
                  >
                    <Edit3 :size="16" />
                  </NuxtLink>
                </td>
              </tr>
              <tr v-if="recentPosts.length === 0">
                <td colspan="4" class="px-2 py-8 text-center text-sm text-slate-500 dark:text-slate-400">暂无文章记录</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Clock3,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  Image as ImageIcon,
  Settings,
  Edit3,
  ExternalLink
} from 'lucide-vue-next';
import type { AdminDashboardSummary } from '~/types/post';

definePageMeta({
  layout: 'admin',
});

const compactNumberFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

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
  { label: '总文章', value: formatStatValue(dashboard.value.stats.totalPosts), icon: FileText, color: 'bg-blue-500' },
  { label: '总评论', value: formatStatValue(dashboard.value.stats.totalComments), icon: MessageSquare, color: 'bg-purple-500' },
  { label: '总阅读', value: formatStatValue(dashboard.value.stats.totalViews), icon: Eye, color: 'bg-brand-600' },
  { label: '待审核评论', value: formatStatValue(dashboard.value.stats.pendingComments), icon: Clock3, color: 'bg-orange-500' },
]);

const recentPosts = computed(() => dashboard.value.recentPosts);

const quickActions = [
  { label: '发布文章', desc: '撰写并发布新内容', icon: Plus, color: 'bg-brand-600', link: '/admin/posts/new' },
  { label: '上传媒体', desc: '管理图片与文件', icon: ImageIcon, color: 'bg-blue-500', link: '/admin/media' },
  { label: '站点预览', desc: '查看前端显示效果', icon: ExternalLink, color: 'bg-purple-500', link: '/' },
  { label: '偏好设置', desc: '调整后台管理选项', icon: Settings, color: 'bg-slate-600', link: '/admin/settings' },
];
</script>

<style scoped>
/* 自定义极简滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  height: 4px; /* 横向滚动条高度非常小 */
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent; /* 轨道透明 */
  margin: 0 32px; /* 避免滚动条顶到边缘，与父级 px-8 (32px) 对齐 */
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1; /* slate-300，浅色提示 */
  border-radius: 4px; /* 圆角设计 */
  opacity: 0.5;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; /* slate-400，悬浮加深 */
}

/* 适配暗黑模式 */
@media (prefers-color-scheme: dark) {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155; /* slate-700 */
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #475569; /* slate-600 */
  }
}
</style>

<template>
  <aside class="space-y-8 sticky top-24">
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm paper-texture overflow-hidden"
    >
      <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 font-serif">
        <TrendingUp :size="16" class="text-brand-600" />
        热门文章
      </h3>
      <div class="space-y-4">
        <NuxtLink
          v-for="(post, index) in popularPosts"
          :key="post.id"
          :to="`/post/${post.identifier}`"
          class="group cursor-pointer flex gap-3"
        >
          <span
            class="text-lg font-black text-slate-200 dark:text-slate-800 group-hover:text-brand-200 transition-colors italic font-serif"
          >
            0{{ index + 1 }}
          </span>
          <div class="space-y-1">
            <h4
              class="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug"
            >
              {{ post.title }}
            </h4>
            <div class="flex items-center gap-3 text-[10px] text-slate-400">
              <span>{{ post.viewsText }} 阅读</span>
              <span class="flex items-center gap-1">
                <Heart :size="10" class="text-red-400 fill-current" />
                {{ post.likesCount }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div
      class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm paper-texture overflow-hidden"
    >
      <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 font-serif">
        <Info :size="16" class="text-brand-600" />
        博客信息
      </h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <FileText :size="14" class="text-slate-300" />
            <span>文章总数</span>
          </div>
          <span class="font-bold text-brand-600 dark:text-brand-400 font-serif">{{ blogStats.postCount }} 篇</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <CalendarDays :size="14" class="text-slate-300" />
            <span>运行天数</span>
          </div>
          <span class="font-bold text-brand-600 dark:text-brand-400 font-serif">{{ blogStats.runningDays }} 天</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Clock :size="14" class="text-slate-300" />
            <span>最后活动</span>
          </div>
          <span class="font-bold text-brand-600 dark:text-brand-400 font-serif">{{ blogStats.lastActivity }}</span>
        </div>
      </div>
    </div>

    <div
      class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm paper-texture overflow-hidden"
    >
      <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 font-serif">
        <Tag :size="16" class="text-brand-600" />
        热门标签
      </h3>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="tag in tags"
          :key="tag.name"
          class="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-400 transition-all cursor-pointer border border-slate-100 dark:border-slate-800"
        >
          {{ tag.name }}
        </span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { Tag, TrendingUp, Info, FileText, CalendarDays, Clock, Heart } from 'lucide-vue-next';
import { computed } from 'vue';
import type { PostInsightsResponse } from '~/types/post-discovery';

const { data: insights } = await useFetch<PostInsightsResponse>('/api/posts/insights', {
  key: 'post-insights',
  default: () => ({
    categories: [],
    popularPosts: [],
    tags: [],
    stats: null,
  }),
});

const compactNumberFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const popularPosts = computed(() =>
  insights.value.popularPosts.slice(0, 3).map((item) => ({
    ...item,
    viewsText: compactNumberFormatter.format(item.viewsCount).toLowerCase(),
  })),
);

const blogStats = computed(() => ({
  postCount: insights.value.stats?.postCount ?? 0,
  runningDays: insights.value.stats?.runningDays ?? 0,
  lastActivity: insights.value.stats?.lastActivity ?? '暂无记录',
}));

const tags = computed(() => insights.value.tags.slice(0, 12));
</script>

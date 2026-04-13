<template>
  <main class="flex-grow pt-32 pb-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6">
      <header class="mb-16 rss-fade-up">
        <div class="relative inline-block mb-4">
          <h1 class="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white font-serif tracking-tighter">
            RSS Feed<span class="text-brand-600">.</span>
          </h1>
          <div class="absolute -bottom-2 left-0 w-24 h-2 bg-brand-600 rounded-full" />
        </div>
        <p class="text-slate-500 dark:text-slate-400 text-lg leading-relaxed max-w-2xl font-sans">
          订阅我们的 RSS 源，以便在您喜欢的阅读器中实时获取最新文章和动态。
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 rss-fade-up rss-delay-1">
        <div
          v-for="feed in feeds"
          :key="feed.title"
          class="group relative p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
        >
          <div class="relative z-10 space-y-6">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                <Rss :size="24" />
              </div>
              <div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white font-serif">
                  {{ feed.title }}
                </h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {{ feed.type }}
                </p>
              </div>
            </div>

            <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {{ feed.description }}
            </p>

            <div class="relative">
              <input
                readonly
                :value="feed.url"
                class="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 focus:outline-none"
              >
              <button
                @click="copyUrl(feed.url)"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-brand-600 transition-colors"
                title="Copy URL"
              >
                <Copy :size="16" />
              </button>
            </div>

            <a
              :href="feed.url"
              target="_blank"
              class="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:gap-3 transition-all"
            >
              Open Feed <ArrowRight :size="16" />
            </a>
          </div>
        </div>
      </div>

      <section class="mt-20 p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 rss-fade-up rss-delay-2 text-center space-y-6">
        <div class="flex justify-center">
          <div class="w-16 h-16 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg">
            <Info :size="24" class="text-brand-600" />
          </div>
        </div>
        <h3 class="text-2xl font-black text-slate-900 dark:text-white font-serif">什么是 RSS？</h3>
        <p class="text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          RSS (Really Simple Syndication) 是一种用于将最新发布的网页内容分发给用户的技术。通过订阅 RSS 源，您可以将多个网站的更新集中在一个地方阅读，而无需逐个访问。
        </p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { Rss, Copy, ArrowRight, Info } from 'lucide-vue-next';
import type { PostInsightsResponse, RssFeedLinkItem } from '~/types/post-discovery';

const { addToast } = useAppToast();
const { settings, fetchSiteSettings } = useSiteSettings();

await fetchSiteSettings();

useSitePageTitle('RSS 订阅');

useSeoMeta({
  description: () => settings.value.site.description,
});

const { data: insights } = await useFetch<PostInsightsResponse>('/api/posts/insights', {
  key: 'post-insights',
  default: () => ({
    categories: [],
    popularPosts: [],
    tags: [],
    stats: null,
  }),
});

const feeds = computed<RssFeedLinkItem[]>(() => {
  const baseUrl = settings.value.site.url.replace(/\/+$/, '');
  const categories = insights.value.categories.slice(0, 6);

  return [
    {
      title: '所有文章',
      type: 'Full Feed',
      description: '获取博客发布的所有文章、动态和技术分享。',
      url: `${baseUrl}/api/feed.xml`,
    },
    ...categories.map((item) => ({
      title: item.name,
      type: 'Category Feed',
      description: `订阅 ${item.name} 分类下的最新文章更新。`,
      url: `${baseUrl}/api/feed/${encodeURIComponent(item.name)}.xml`,
    })),
  ];
});

function copyUrl(url: string) {
  if (import.meta.client) {
    navigator.clipboard.writeText(url);
    addToast('RSS 链接已复制', 'success');
  }
}
</script>

<style scoped>
.rss-fade-up {
  animation: rss-fade-up 0.7s ease both;
}

.rss-delay-1 {
  animation-delay: 0.1s;
}

.rss-delay-2 {
  animation-delay: 0.2s;
}

@keyframes rss-fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

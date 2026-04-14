<template>
  <main class="flex-grow pt-32 pb-20">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-2 hidden lg:block">
          <LeftSidebar />
        </div>

        <div class="lg:col-span-8 space-y-12">
          <header class="mb-16">
            <div class="relative inline-block">
              <h1 class="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white mb-4 font-serif tracking-tighter">Guestbook<span class="text-brand-600">.</span></h1>
              <div class="absolute -bottom-2 left-0 w-24 h-2 bg-brand-600 rounded-full" />
            </div>
            <p class="mt-8 text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-sans">
              欢迎来到数字会客厅。无论是技术探讨、生活杂谈，还是简单打个招呼，都欢迎留言。
            </p>
          </header>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div
              v-for="item in guestbookHighlights"
              :key="item.id"
              class="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-3"
            >
              <div class="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <component :is="item.icon" :class="item.color" />
              </div>
              <h3 class="font-bold text-slate-800 dark:text-slate-200 font-serif">{{ item.title }}</h3>
              <p class="text-xs text-slate-400">{{ item.description }}</p>
            </div>
          </div>

          <div
            class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 dark:border-slate-800 shadow-sm paper-texture"
          >
            <div class="flex items-center gap-3 mb-10">
              <div class="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                <MessageSquare :size="20" />
              </div>
              <div class="space-y-1">
                <h2 class="text-2xl font-black text-slate-900 dark:text-white font-serif">{{ page.commentSection.title }}</h2>
                <p
                  v-if="page.commentSection.description"
                  class="text-sm text-slate-500 dark:text-slate-400"
                >
                  {{ page.commentSection.description }}
                </p>
              </div>
            </div>

            <CommentSection page-id="guestbook" />
          </div>
        </div>

        <div class="lg:col-span-2 hidden lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { MessageSquare, Sparkles, Heart, Coffee } from 'lucide-vue-next';

const { settings, fetchSiteSettings } = useSiteSettings();
const { pageSettings, fetchPageSettings } = usePageSettings();

await Promise.all([
  fetchPageSettings(),
  fetchSiteSettings(),
]);

if (!pageSettings.value.guestbook.enabled) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const page = computed(() => pageSettings.value.guestbook);

useSitePageTitle(() => page.value.seo.title || '留言板');

useSeoMeta({
  description: () => page.value.seo.description || settings.value.site.description,
});

const guestbookHighlights = [
  {
    id: 'guestbook-highlight-sparkles',
    title: '分享灵感',
    description: '碰撞思维火花',
    icon: Sparkles,
    color: 'text-amber-500',
  },
  {
    id: 'guestbook-highlight-heart',
    title: '传递温暖',
    description: '留下鼓励话语',
    icon: Heart,
    color: 'text-red-500',
  },
  {
    id: 'guestbook-highlight-coffee',
    title: '闲聊时光',
    description: '一杯咖啡邂逅',
    icon: Coffee,
    color: 'text-brand-600',
  },
] as const;
</script>

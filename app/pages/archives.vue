<template>
  <main class="flex-grow pt-32 pb-20">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-2 hidden lg:block">
          <LeftSidebar />
        </div>

        <div class="lg:col-span-8 space-y-12">
          <header class="mb-16 archive-fade-up">
            <div class="relative inline-block">
              <h1 class="text-5xl sm:text-8xl font-black text-slate-900 dark:text-white mb-4 font-serif tracking-tighter">
                Archives<span class="text-brand-600">.</span>
              </h1>
              <div class="absolute -bottom-2 left-0 w-32 h-2 bg-brand-600 rounded-full" />
            </div>

            <div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-12">
              <p class="text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-sans text-lg">
                时光流转，文字留痕。这里记录了我的技术成长与思考点滴，共计
                <span class="text-brand-600 font-bold font-serif">{{ archiveTotal }}</span>
                篇文章。
              </p>

              <div class="flex flex-col gap-4 w-full md:w-auto">
                <div class="relative group">
                  <Search
                    :size="18"
                    class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors"
                  />
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="搜索归档文章..."
                    class="w-full md:w-80 pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm font-sans text-sm"
                  >
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 mt-8">
              <button
                v-for="cat in archiveCategories"
                :key="cat.name"
                type="button"
                @click="selectedCategory = cat.name"
                :class="selectedCategory === cat.name
                  ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-900/50'"
                class="px-4 py-2 rounded-xl text-xs font-bold transition-all border"
              >
                {{ cat.name }}
                <span
                  class="ml-2 opacity-60"
                  :class="selectedCategory === cat.name ? 'text-white' : 'text-brand-600'"
                >
                  {{ cat.count }}
                </span>
              </button>
            </div>
          </header>

          <TransitionGroup
            v-if="years.length > 0"
            name="archive-sections"
            tag="div"
            class="space-y-24"
          >
            <section v-for="year in years" :key="year" class="relative">
              <div class="absolute -top-16 -left-8 text-[12rem] sm:text-[15rem] font-black text-slate-900/[0.02] dark:text-white/[0.02] select-none font-serif pointer-events-none tracking-tighter">
                {{ year }}
              </div>

              <div class="relative z-10 space-y-10">
                <div class="flex items-center gap-6 mb-12">
                  <h2 class="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                    {{ year }}
                  </h2>
                  <div class="flex-grow h-px bg-slate-100 dark:bg-slate-800" />
                  <div class="flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-800">
                    <Hash :size="12" class="text-brand-600" />
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {{ groupedPosts[year]?.length ?? 0 }} Articles
                    </span>
                  </div>
                </div>

                <div class="grid gap-8 relative">
                  <div class="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hidden sm:block" />

                  <article
                    v-for="(post, idx) in groupedPosts[year]"
                    :key="post.id"
                    class="group relative pl-0 sm:pl-20 archive-card"
                    :style="{ animationDelay: `${idx * 0.05}s` }"
                  >
                    <div class="absolute left-[30px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 group-hover:border-brand-600 group-hover:scale-150 transition-all z-20 hidden sm:block" />

                    <div class="flex flex-col sm:flex-row sm:items-center gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-900/50 transition-all hover:shadow-2xl hover:shadow-brand-500/5 paper-texture overflow-hidden">
                      <div class="flex items-center gap-4 shrink-0 sm:w-32">
                        <div class="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                          <Calendar :size="20" />
                        </div>

                        <div class="sm:hidden text-sm font-bold text-slate-400 font-serif">
                          {{ post.publishedAt }}
                        </div>

                        <div class="hidden sm:block">
                          <div class="text-lg font-black text-slate-900 dark:text-white font-serif leading-none">
                            {{ post.publishedAt.split('-')[2] }}
                          </div>
                          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {{ formatMonth(post.publishedAt) }}
                          </div>
                        </div>
                      </div>

                      <div class="flex-grow min-w-0 space-y-2">
                        <div class="flex items-center gap-3">
                          <span class="px-2 py-0.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-[9px] font-bold rounded uppercase tracking-wider">
                            {{ post.category }}
                          </span>
                          <div class="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                            <Clock :size="12" />
                            {{ post.readTimeText }}
                          </div>
                        </div>

                        <NuxtLink :to="`/post/${post.identifier}`">
                          <h3 class="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 transition-colors line-clamp-1 font-serif leading-tight">
                            {{ post.title }}
                          </h3>
                        </NuxtLink>

                        <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 font-sans">
                          {{ post.excerpt }}
                        </p>

                        <div class="flex flex-wrap gap-3 pt-2">
                          <span
                            v-for="tag in post.tags.slice(0, 3)"
                            :key="tag"
                            class="text-[10px] text-slate-400 flex items-center gap-1 hover:text-brand-600 transition-colors cursor-pointer"
                          >
                            <Tag :size="10" />
                            {{ tag }}
                          </span>
                        </div>
                      </div>

                      <NuxtLink
                        :to="`/post/${post.identifier}`"
                        class="shrink-0 w-12 h-12 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm"
                      >
                        <ChevronRight :size="20" />
                      </NuxtLink>
                    </div>
                  </article>
                </div>
              </div>
            </section>
          </TransitionGroup>

          <div v-else class="py-32 text-center space-y-6 archive-fade-up">
            <div class="text-6xl text-slate-200 dark:text-slate-800 font-black font-serif">Empty</div>
            <p class="text-slate-400 max-w-xs mx-auto">没有找到匹配的文章，尝试更换搜索词或分类。</p>
            <button
              type="button"
              class="text-brand-600 font-bold text-sm hover:underline"
              @click="resetFilters"
            >
              重置所有过滤器
            </button>
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
import {
  Calendar,
  Tag,
  Search,
  Clock,
  Hash,
  ChevronRight,
} from 'lucide-vue-next';
import type { PublicPostArchiveResponse, PublicPostListItem } from '~/types/post';

const { settings, fetchSiteSettings } = useSiteSettings();
const searchQuery = ref('');
const selectedCategory = ref('全部');

await fetchSiteSettings();

useSitePageTitle('归档');

useSeoMeta({
  description: () => settings.value.site.description,
});

const { data: archiveResponse } = await useAsyncData(
  'public-archive-posts',
  () => $fetch<PublicPostArchiveResponse>('/api/posts/archive'),
);

const allArchivePosts = computed(() => archiveResponse.value?.items ?? []);
const archiveTotal = computed(() => allArchivePosts.value.length);
const archiveCategories = computed(() => [
  { name: '全部', count: allArchivePosts.value.length },
  ...(archiveResponse.value?.categories ?? []),
]);

const filteredPosts = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  return allArchivePosts.value.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(keyword)
      || post.excerpt.toLowerCase().includes(keyword)
      || post.tags.some(tag => tag.toLowerCase().includes(keyword));
    const matchesCategory = selectedCategory.value === '全部' || post.category === selectedCategory.value;

    return matchesSearch && matchesCategory;
  });
});

const groupedPosts = computed(() => {
  return filteredPosts.value.reduce<Record<string, PublicPostListItem[]>>((acc, post) => {
    const year = post.publishedAt.split('-')[0] ?? 'Unknown';

    if (!acc[year]) {
      acc[year] = [];
    }

    acc[year].push(post);
    return acc;
  }, {});
});

const years = computed(() => Object.keys(groupedPosts.value).sort((a, b) => b.localeCompare(a)));

function resetFilters() {
  searchQuery.value = '';
  selectedCategory.value = '全部';
}

function formatMonth(date: string) {
  return new Date(date).toLocaleString('en-US', { month: 'short' });
}
</script>

<style scoped>
.archive-fade-up {
  animation: archive-fade-up 0.7s ease both;
}

.archive-card {
  animation: archive-card-enter 0.6s ease both;
}

.archive-sections-move,
.archive-sections-enter-active,
.archive-sections-leave-active {
  transition: all 0.45s ease;
}

.archive-sections-enter-from,
.archive-sections-leave-to {
  opacity: 0;
  transform: translateY(24px);
}

.archive-sections-leave-active {
  position: absolute;
  width: 100%;
}

@keyframes archive-fade-up {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes archive-card-enter {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>

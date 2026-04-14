<template>
  <main class="flex-grow pt-32 pb-20">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-2 order-2 lg:order-1">
          <LeftSidebar />
        </div>

        <div class="lg:col-span-8 order-1 lg:order-2 flex flex-col h-full">
          <div class="flex flex-col flex-grow space-y-8">
            <HitokotoCard class="shrink-0" />

            <div class="flex items-center justify-between mb-2 shrink-0">
              <h2 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-serif">
                {{ selectedCategory === '全部' ? '最新发布' : `${selectedCategory} 频道` }}
              </h2>
              <div class="h-px flex-grow bg-slate-100 dark:bg-slate-800 ml-4" />
            </div>

            <div class="flex-grow flex flex-col relative h-[650px] mb-8">
                <div class="space-y-8 absolute top-0 left-0 right-0">
                  <template v-if="paginatedPosts.length > 0">
                    <PostCard v-for="(post, index) in paginatedPosts" :key="post.id" :post="post" :index="index" />
                  </template>
                  <div v-else class="py-20 text-center space-y-4">
                    <div class="text-4xl">Empty</div>
                    <p class="text-slate-400">该分类下暂无文章</p>
                  </div>
                </div>

                <div class="absolute -bottom-12 left-0 right-0 flex justify-center z-10 pointer-events-none">
                  <div class="pointer-events-auto">
                    <PaginationNav
                      v-if="totalItems > postsPerPage"
                      :current-page="currentPage"
                      :total-items="totalItems"
                      :items-per-page="postsPerPage"
                      @page-change="handlePageChange"
                    />
                  </div>
                </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 order-3">
          <RightSidebar />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { PublicPostListResponse } from '~/types/post';

const route = useRoute();
const router = useRouter();
const { settings, fetchSiteSettings } = useSiteSettings();

const postsPerPage = 3;

const selectedCategory = computed(
  () => (route.query.category as string | undefined) ?? '全部',
);

const currentPage = computed(() => {
  const value = Number.parseInt((route.query.page as string | undefined) ?? '1', 10);
  return Number.isNaN(value) || value < 1 ? 1 : value;
});

await fetchSiteSettings();

useSitePageTitle();

useSeoMeta({
  description: () => settings.value.site.description,
});

const { data: homeResponse } = await useAsyncData(
  () => `public-home-posts:${selectedCategory.value}:${currentPage.value}`,
  () => $fetch<PublicPostListResponse>('/api/posts', {
    query: {
      category: selectedCategory.value === '全部' ? undefined : selectedCategory.value,
      page: currentPage.value,
      pageSize: postsPerPage,
    },
  }),
  {
    watch: [selectedCategory, currentPage],
  },
);

const paginatedPosts = computed(() => homeResponse.value?.items ?? []);
const totalItems = computed(() => homeResponse.value?.total ?? 0);

function handlePageChange(page: number) {
  const nextQuery = {
    ...route.query,
    page: String(page),
  };
  router.push({ path: '/', query: nextQuery });
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
</script>

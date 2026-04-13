<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-4 sm:px-6">
          <Search :size="20" class="text-brand-600" />
          <input
            ref="inputRef"
            v-model.trim="query"
            type="text"
            placeholder="搜索文章标题、摘要、标签..."
            class="flex-1 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            @keydown.enter.prevent="submitSearch"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            class="-my-1"
            @click="closeSearch"
          />
        </div>

        <div class="max-h-[60vh] overflow-auto">
          <div class="px-4 py-3 sm:px-6 text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            {{ headerText }}
          </div>

          <button
            v-for="post in shownPosts"
            :key="post.id"
            type="button"
            class="w-full text-left px-4 py-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition"
            @click="goPost(post.identifier)"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {{ post.title }}
                </div>
                <div class="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {{ post.excerpt }}
                </div>
                <div class="mt-2 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                  <UBadge
                    size="sm"
                    variant="subtle"
                    color="primary"
                    class="rounded-full"
                  >
                    {{ post.category }}
                  </UBadge>
                  <span>{{ post.date }}</span>
                </div>
              </div>
              <ArrowUpRight :size="16" class="shrink-0 text-slate-300 dark:text-slate-600" />
            </div>
          </button>

          <div
            v-if="shownPosts.length === 0"
            class="px-6 py-16 text-center text-slate-500 dark:text-slate-400"
          >
            {{ hasKeyword ? '未匹配到文章' : '输入关键词开始搜索' }}
          </div>
        </div>

        <div class="flex items-center justify-between px-4 py-3 sm:px-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
          <span>回车打开第一条结果</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ArrowUpRight, Search } from 'lucide-vue-next';
import type { PostSearchResultItem } from '~/types/post-discovery';

const router = useRouter();
const inputRef = ref<HTMLInputElement | null>(null);
const { isOpen, query, closeSearch } = useSearchDialog();
const searchResults = ref<PostSearchResultItem[]>([]);
const isSearching = ref(false);

let searchTimer: ReturnType<typeof setTimeout> | null = null;
let searchRequestId = 0;

const hasKeyword = computed(() => query.value.trim().length > 0);
const shownPosts = computed(() => searchResults.value.slice(0, 8));

const headerText = computed(() =>
  isSearching.value
    ? '搜索中...'
    : hasKeyword.value
      ? `搜索结果 ${searchResults.value.length}`
      : '等待输入',
);

function clearSearchTimer() {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
}

async function refreshSearchResults() {
  const keyword = query.value.trim();
  const requestId = ++searchRequestId;

  if (!keyword) {
    isSearching.value = false;
    searchResults.value = [];
    return;
  }

  isSearching.value = true;

  try {
    const response = await $fetch<PostSearchResultItem[]>('/api/posts/search', {
      query: {
        keyword,
      },
    });

    if (requestId === searchRequestId) {
      searchResults.value = response;
    }
  }
  catch {
    if (requestId === searchRequestId) {
      searchResults.value = [];
    }
  }
  finally {
    if (requestId === searchRequestId) {
      isSearching.value = false;
    }
  }
}

function scheduleSearch() {
  clearSearchTimer();

  if (!hasKeyword.value) {
    searchRequestId += 1;
    isSearching.value = false;
    searchResults.value = [];
    return;
  }

  searchTimer = setTimeout(() => {
    void refreshSearchResults();
  }, 180);
}

function goPost(identifier: string) {
  closeSearch();
  router.push(`/post/${identifier}`);
}

function submitSearch() {
  if (shownPosts.value.length > 0) {
    goPost(shownPosts.value[0]?.identifier ?? '');
  }
}

function onGlobalKey(event: KeyboardEvent) {
  const trigger = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
  if (trigger) {
    event.preventDefault();
    isOpen.value = true;
  }
}

watch(isOpen, async (open) => {
  if (!open) {
    clearSearchTimer();
    searchRequestId += 1;
    isSearching.value = false;
    searchResults.value = [];
    return;
  }
  await nextTick();
  inputRef.value?.focus();
  scheduleSearch();
});

watch(query, () => {
  scheduleSearch();
});

onMounted(() => {
  window.addEventListener('keydown', onGlobalKey);
});

onBeforeUnmount(() => {
  clearSearchTimer();
  window.removeEventListener('keydown', onGlobalKey);
});
</script>

<template>
  <div class="space-y-6 pb-20">
    <UCard :ui="panelUi">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="font-serif text-3xl font-black tracking-tight text-slate-900 dark:text-white">文章管理</h1>
            <UBadge color="primary" variant="soft" class="rounded-full">共 {{ totalPosts }} 篇</UBadge>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">管理文章内容、发布状态、分类筛选与批量处理。</p>
        </div>

        <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] xl:w-[32rem]">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            size="lg"
            placeholder="搜索文章标题或摘要"
          />
          <UButton to="/admin/posts/new" icon="i-lucide-plus" size="lg" class="justify-center">
            发布新文章
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard :ui="panelUi">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            v-for="status in statuses"
            :key="status.id"
            :color="activeStatus === status.id ? 'primary' : 'neutral'"
            :variant="activeStatus === status.id ? 'solid' : 'soft'"
            size="sm"
            @click="handleStatusChange(status.id)"
          >
            {{ status.label }}
          </UButton>
        </div>

        <div class="grid gap-3 sm:grid-cols-[12rem_auto]">
          <USelectMenu
            v-model="activeCategory"
            :items="categoryOptions"
            value-key="value"
            label-key="label"
            placeholder="所有分类"
            icon="i-lucide-layers-3"
            @update:model-value="handleCategoryChange"
          >
            <template #item="{ item }">
              <div class="flex w-full items-center justify-between gap-3">
                <span class="truncate">{{ item.label }}</span>
                <UBadge color="neutral" variant="soft" size="xs">{{ item.count }}</UBadge>
              </div>
            </template>
          </USelectMenu>

          <div v-if="selectedIds.length > 0" class="flex items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50 p-1.5 dark:border-brand-900/50 dark:bg-brand-950/30">
            <span class="px-2 text-xs font-bold text-brand-700 dark:text-brand-300">{{ selectedIds.length }} 选定</span>
            <UButton color="success" variant="soft" size="sm" icon="i-lucide-check-circle" @click="handleBulkPublish">
              发布
            </UButton>
            <UButton color="error" variant="soft" size="sm" icon="i-lucide-trash-2" @click="handleBulkDelete">
              删除
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <UCard :ui="{ ...panelUi, body: 'p-0' }">
      <div v-if="loading" class="flex items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500 dark:text-slate-400">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
        正在加载文章列表
      </div>

      <template v-else-if="posts.length > 0">
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[960px] border-collapse text-left">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                <th class="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700"
                    @change="toggleSelectAll"
                  >
                </th>
                <th class="px-4 py-4">文章内容</th>
                <th class="px-4 py-4 text-center">分类</th>
                <th class="px-4 py-4 text-center">互动统计</th>
                <th class="px-4 py-4">最后更新</th>
                <th class="px-4 py-4">发布状态</th>
                <th class="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-800/70">
              <tr
                v-for="post in posts"
                :key="post.id"
                class="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/50"
                :class="selectedIds.includes(post.id) ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''"
              >
                <td class="px-6 py-5">
                  <input
                    v-model="selectedIds"
                    type="checkbox"
                    :value="post.id"
                    class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700"
                  >
                </td>
                <td class="px-4 py-5">
                  <div class="flex items-center gap-4">
                    <div class="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                      <img v-if="post.coverImageUrl" :src="post.coverImageUrl" :alt="post.title" class="h-full w-full object-cover">
                      <UIcon v-else name="i-lucide-image" class="size-5 text-slate-400" />
                    </div>
                    <div class="min-w-0 space-y-1">
                      <p class="truncate text-sm font-bold text-slate-900 dark:text-white">{{ post.title }}</p>
                      <p class="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{{ post.excerpt || '暂无摘要描述' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-5 text-center">
                  <UBadge color="primary" variant="soft">{{ post.category }}</UBadge>
                </td>
                <td class="px-4 py-5">
                  <div class="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span class="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-2.5 py-1 dark:bg-slate-900"><UIcon name="i-lucide-message-square" />{{ post.commentsCount }}</span>
                    <span class="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-2.5 py-1 dark:bg-slate-900"><UIcon name="i-lucide-heart" />{{ post.likesCount }}</span>
                    <span class="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-2.5 py-1 dark:bg-slate-900"><UIcon name="i-lucide-eye" />{{ post.viewsCount }}</span>
                  </div>
                </td>
                <td class="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">{{ post.updatedAt }}</td>
                <td class="px-4 py-5">
                  <UBadge :color="post.status === 'published' ? 'success' : 'warning'" variant="soft">
                    {{ post.status === 'published' ? '已发布' : '草稿箱' }}
                  </UBadge>
                </td>
                <td class="px-6 py-5">
                  <div class="flex justify-end gap-2">
                    <UButton :to="{ path: '/admin/posts/new', query: { id: post.id } }" color="neutral" variant="ghost" size="sm" icon="i-lucide-pencil" aria-label="编辑文章" />
                    <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-external-link" aria-label="预览页面" @click="previewPost(post.identifier)" />
                    <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2" aria-label="删除文章" @click="handleDelete(post.id)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
          <article v-for="post in posts" :key="post.id" class="space-y-4 p-4">
            <div class="flex items-start gap-3">
              <input v-model="selectedIds" type="checkbox" :value="post.id" class="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700">
              <div class="min-w-0 flex-1 space-y-2">
                <div class="flex items-start justify-between gap-3">
                  <h2 class="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">{{ post.title }}</h2>
                  <UBadge :color="post.status === 'published' ? 'success' : 'warning'" variant="soft" size="xs">
                    {{ post.status === 'published' ? '已发布' : '草稿' }}
                  </UBadge>
                </div>
                <p class="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{{ post.excerpt || '暂无摘要描述' }}</p>
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <UBadge color="primary" variant="soft" size="xs">{{ post.category }}</UBadge>
                  <span>{{ post.updatedAt }}</span>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
              <span class="rounded-xl bg-slate-50 py-2 dark:bg-slate-900">评论 {{ post.commentsCount }}</span>
              <span class="rounded-xl bg-slate-50 py-2 dark:bg-slate-900">喜欢 {{ post.likesCount }}</span>
              <span class="rounded-xl bg-slate-50 py-2 dark:bg-slate-900">浏览 {{ post.viewsCount }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <UButton :to="{ path: '/admin/posts/new', query: { id: post.id } }" color="neutral" variant="soft" size="sm" icon="i-lucide-pencil" class="justify-center">编辑</UButton>
              <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-external-link" class="justify-center" @click="previewPost(post.identifier)">预览</UButton>
              <UButton color="error" variant="soft" size="sm" icon="i-lucide-trash-2" class="justify-center" @click="handleDelete(post.id)">删除</UButton>
            </div>
          </article>
        </div>

        <div class="flex flex-col gap-4 border-t border-slate-100 px-4 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            显示 {{ currentRangeStart }} - {{ currentRangeEnd }} 条，共 {{ totalPosts }} 条结果
          </p>
          <PaginationNav
            :current-page="currentPage"
            :total-items="totalPosts"
            :items-per-page="pageSize"
            @page-change="handlePageChange"
          />
        </div>
      </template>

      <div v-else class="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div class="grid size-16 place-items-center rounded-[2rem] bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600">
          <UIcon name="i-lucide-file-x" class="size-8" />
        </div>
        <h2 class="mt-5 text-lg font-black text-slate-900 dark:text-white">未找到相关文章</h2>
        <p class="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">调整搜索关键词、分类或发布状态后可重新查看文章列表。</p>
        <UButton class="mt-5" color="neutral" variant="soft" icon="i-lucide-rotate-ccw" @click="resetFilters">
          重置筛选条件
        </UButton>
      </div>
    </UCard>

    <BaseConfirm
      v-model="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :type="confirmState.type"
      @confirm="confirmState.onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import BaseConfirm from '~/components/BaseConfirm.vue';
import { useAppToast } from '~/composables/useAppToast';
import { listPostCategories } from '~/services/admin-post-category';
import type { AdminPostCategoryItem } from '~/types/admin-post-category';
import type { AdminPostListItem, AdminPostListResponse } from '~/types/post';
import { resolveRequestErrorMessage } from '~/utils/request-error';

definePageMeta({
    layout: 'admin',
});

const { addToast } = useAppToast();

const panelUi = { root: 'rounded-[2rem] border-slate-200 dark:border-slate-800 overflow-hidden', body: 'p-5 sm:p-6' };

type PostStatusFilter = 'all' | AdminPostListItem['status'];
type ConfirmTone = 'primary' | 'danger' | 'warning' | 'success';
type ConfirmHandler = () => void | Promise<void>;

const searchQuery = ref('');
const submittedSearchQuery = ref('');
const activeStatus = ref<PostStatusFilter>('all');
const activeCategory = ref('all');
const loading = ref(false);
const currentPage = ref(1);
const totalPosts = ref(0);
const pageSize = 10;
const posts = ref<AdminPostListItem[]>([]);
const postCategories = ref<AdminPostCategoryItem[]>([]);
const selectedIds = ref<number[]>([]);
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const confirmState = ref({
    show: false,
    title: '',
    message: '',
    type: 'primary' as ConfirmTone,
    onConfirm: (() => undefined) as ConfirmHandler,
});

function openConfirm(options: { title: string; message: string; type?: ConfirmTone; onConfirm: ConfirmHandler }) {
    confirmState.value = {
        show: true,
        title: options.title,
        message: options.message,
        type: options.type || 'primary',
        onConfirm: options.onConfirm,
    };
}

const statuses = [
    { id: 'all', label: '全部' },
    { id: 'published', label: '已发布' },
    { id: 'draft', label: '草稿箱' },
] as const;

async function refreshPosts(): Promise<boolean> {
    loading.value = true;

    try {
        const nextResponse = await $fetch<AdminPostListResponse>('/api/admin/posts', {
            query: {
                status: activeStatus.value === 'all' ? undefined : activeStatus.value,
                category: activeCategory.value === 'all' ? undefined : activeCategory.value,
                keyword: submittedSearchQuery.value || undefined,
                page: currentPage.value,
                pageSize,
            },
        });
        const nextPostIds = new Set(nextResponse.items.map((post) => post.id));
        posts.value = nextResponse.items;
        totalPosts.value = nextResponse.total;
        selectedIds.value = selectedIds.value.filter((id) => nextPostIds.has(id));
        return true;
    } catch (error) {
        if (import.meta.client) {
            addToast(resolveRequestErrorMessage(error, '文章列表加载失败'), 'error');
        }

        return false;
    } finally {
        loading.value = false;
    }
}

async function refreshPostCategories(): Promise<boolean> {
    try {
        const nextCategories = await listPostCategories();
        postCategories.value = nextCategories;
        const categoryNameSet = new Set(nextCategories.map((item) => item.name));
        if (activeCategory.value !== 'all' && !categoryNameSet.has(activeCategory.value)) {
            activeCategory.value = 'all';
            return true;
        }
        return false;
    } catch (error) {
        postCategories.value = [];
        if (import.meta.client) {
            addToast(resolveRequestErrorMessage(error, '分类列表加载失败，当前改为文章数据统计'), 'warning');
        }
        return false;
    }
}

async function refreshPostsWithPageFallback(): Promise<boolean> {
    const refreshSucceeded = await refreshPosts();
    if (refreshSucceeded && posts.value.length === 0 && currentPage.value > 1) {
        currentPage.value -= 1;
        return await refreshPosts();
    }

    return refreshSucceeded;
}

async function deletePostById(id: number): Promise<boolean> {
    await $fetch(`/api/admin/posts/${id}`, {
        method: 'DELETE',
    });
    selectedIds.value = selectedIds.value.filter((sid) => sid !== id);
    const categoryFilterReset = await refreshPostCategories();
    if (categoryFilterReset) {
        currentPage.value = 1;
    }
    return await refreshPostsWithPageFallback();
}

async function publishSelectedPosts(): Promise<boolean> {
    await $fetch('/api/admin/posts/bulk-publish', {
        method: 'POST',
        body: {
            ids: selectedIds.value,
        },
    });
    selectedIds.value = [];
    const categoryFilterReset = await refreshPostCategories();
    if (categoryFilterReset) {
        currentPage.value = 1;
    }
    return await refreshPostsWithPageFallback();
}

const categoryOptions = computed(() => {
    if (postCategories.value.length > 0) {
        const totalCategoryCount = postCategories.value.reduce((sum, item) => sum + item.postCount, 0);
        return [
            {
                label: '所有分类',
                value: 'all',
                count: totalCategoryCount,
            },
            ...postCategories.value.map((item) => ({
                label: item.name,
                value: item.name,
                count: item.postCount,
            })),
        ];
    }

    const countByCategory = posts.value.reduce<Record<string, number>>((accumulator, post) => {
        accumulator[post.category] = (accumulator[post.category] ?? 0) + 1;
        return accumulator;
    }, {});

    const categoryNames = Object.keys(countByCategory).sort((left, right) => left.localeCompare(right, 'zh-CN'));
    const options = categoryNames.map((name) => ({
        label: name,
        value: name,
        count: countByCategory[name] ?? 0,
    }));

    return [
        {
            label: '所有分类',
            value: 'all',
            count: totalPosts.value,
        },
        ...options,
    ];
});

const currentRangeStart = computed(() => (totalPosts.value === 0 ? 0 : (currentPage.value - 1) * pageSize + 1));
const currentRangeEnd = computed(() => (totalPosts.value === 0 ? 0 : Math.min(currentPage.value * pageSize, totalPosts.value)));

const isAllSelected = computed(() => {
    return posts.value.length > 0 && posts.value.every((post) => selectedIds.value.includes(post.id));
});

function toggleSelectAll() {
    const visibleIds = new Set(posts.value.map((post) => post.id));

    if (isAllSelected.value) {
        selectedIds.value = selectedIds.value.filter((id) => !visibleIds.has(id));
    } else {
        selectedIds.value = Array.from(new Set([...selectedIds.value, ...visibleIds]));
    }
}

function resetFilters() {
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = null;
    }
    searchQuery.value = '';
    submittedSearchQuery.value = '';
    activeStatus.value = 'all';
    activeCategory.value = 'all';
    currentPage.value = 1;
    void refreshPosts();
}

function handlePageChange(page: number) {
    if (page === currentPage.value) {
        return;
    }

    currentPage.value = page;
    void refreshPosts();
}

function previewPost(identifier: string) {
    if (import.meta.client) {
        window.open(`/post/${identifier}`, '_blank', 'noopener,noreferrer');
    }
}

function handleStatusChange(status: PostStatusFilter) {
    if (status === activeStatus.value) {
        return;
    }

    activeStatus.value = status;
    currentPage.value = 1;
    void refreshPosts();
}

function handleCategoryChange(category: unknown) {
    activeCategory.value = typeof category === 'string' ? category : 'all';
    currentPage.value = 1;
    void refreshPosts();
}

function handleDelete(id: number) {
    openConfirm({
        title: '删除确认',
        message: '确定要删除这篇文章吗？此操作不可撤销且将永久移除该内容。',
        type: 'danger',
        onConfirm: async () => {
            try {
                const refreshSucceeded = await deletePostById(id);

                if (import.meta.client) {
                    if (refreshSucceeded) {
                        addToast('文章已删除', 'success');
                    } else {
                        addToast('文章已删除，但列表刷新失败', 'warning');
                    }
                }
            } catch (error) {
                if (import.meta.client) {
                    addToast(resolveRequestErrorMessage(error, '文章删除失败'), 'error');
                }
            }
        },
    });
}

function handleBulkDelete() {
    openConfirm({
        title: '批量删除确认',
        message: `确定要删除选中的 ${selectedIds.value.length} 篇文章吗？此操作不可撤销。`,
        type: 'danger',
        onConfirm: async () => {
            const ids = [...selectedIds.value];

            try {
                await Promise.all(
                    ids.map((id) =>
                        $fetch(`/api/admin/posts/${id}`, {
                            method: 'DELETE',
                        }),
                    ),
                );
                selectedIds.value = [];
                const categoryFilterReset = await refreshPostCategories();
                if (categoryFilterReset) {
                    currentPage.value = 1;
                }
                const refreshSucceeded = await refreshPostsWithPageFallback();

                if (import.meta.client) {
                    if (refreshSucceeded) {
                        addToast(`已删除 ${ids.length} 篇文章`, 'success');
                    } else {
                        addToast(`已删除 ${ids.length} 篇文章，但列表刷新失败`, 'warning');
                    }
                }
            } catch (error) {
                await refreshPostsWithPageFallback();

                if (import.meta.client) {
                    addToast(resolveRequestErrorMessage(error, '批量删除失败'), 'error');
                }
            }
        },
    });
}

function handleBulkPublish() {
    openConfirm({
        title: '批量发布确认',
        message: `确定要将选中的 ${selectedIds.value.length} 篇文章全部发布吗？`,
        type: 'success',
        onConfirm: async () => {
            const publishCount = selectedIds.value.length;

            try {
                const refreshSucceeded = await publishSelectedPosts();

                if (import.meta.client) {
                    if (refreshSucceeded) {
                        addToast(`已发布 ${publishCount} 篇文章`, 'success');
                    } else {
                        addToast(`已发布 ${publishCount} 篇文章，但列表刷新失败`, 'warning');
                    }
                }
            } catch (error) {
                if (import.meta.client) {
                    addToast(resolveRequestErrorMessage(error, '批量发布失败'), 'error');
                }
            }
        },
    });
}

watch(searchQuery, () => {
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }

    const nextKeyword = searchQuery.value.trim();
    if (nextKeyword === submittedSearchQuery.value) {
        return;
    }

    searchDebounceTimer = setTimeout(() => {
        submittedSearchQuery.value = searchQuery.value.trim();
        currentPage.value = 1;
        void refreshPosts();
    }, 300);
});

onBeforeUnmount(() => {
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }
});

onMounted(() => {
    refreshPostCategories();
    refreshPosts();
});
</script>

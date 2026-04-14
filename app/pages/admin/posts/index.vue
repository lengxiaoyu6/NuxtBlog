<template>
    <div class="space-y-8 pb-20">
        <!-- Header Area -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div class="flex-1">
                <div class="flex items-center gap-3">
                    <h1 class="text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                        文章管理
                    </h1>
                    <div
                        class="hidden sm:flex items-center px-2.5 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg border border-brand-100 dark:border-brand-800/50">
                        <span class="text-[10px] font-black uppercase tracking-widest mr-1.5 opacity-70">Total</span>
                        <span class="text-sm font-black">{{ totalPosts }}</span>
                    </div>
                </div>
                <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">管理、编辑和发布您的博客内容。</p>
            </div>
        </div>

        <!-- Toolbar Area -->
        <div
            class="flex flex-col sm:flex-row sm:items-center justify-start gap-4 bg-slate-50/50 dark:bg-slate-800/20 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/50">
            <div class="flex flex-wrap items-center gap-3">
                <!-- Search -->
                <div class="relative w-full sm:w-64 group">
                    <Search
                        class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors"
                        :size="16" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="搜索文章..."
                        class="w-full pl-10 pr-4 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-600 transition-all text-sm shadow-sm" />
                </div>

                <div class="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800"></div>

                <!-- New Post Button -->
                <NuxtLink
                    to="/admin/posts/new"
                    class="flex items-center gap-2 px-5 h-10 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all active:scale-95 whitespace-nowrap group">
                    <Plus :size="18" class="group-hover:rotate-90 transition-transform duration-300" />
                    发布新文章
                </NuxtLink>

                <!-- Bulk Actions -->
                <Transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform -translate-x-2 opacity-0"
                    enter-to-class="transform translate-x-0 opacity-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="transform translate-x-0 opacity-100"
                    leave-to-class="transform -translate-x-2 opacity-0">
                    <div
                        v-if="selectedIds.length > 0"
                        class="flex items-center h-10 gap-2 bg-brand-50 dark:bg-brand-900/20 px-3 rounded-xl border border-brand-100 dark:border-brand-800/50 shadow-sm">
                        <span class="text-xs font-bold text-brand-700 dark:text-brand-400 px-1"
                            >{{ selectedIds.length }} 选定</span
                        >
                        <div class="w-px h-4 bg-brand-200 dark:bg-brand-800"></div>
                        <div class="flex items-center gap-1">
                            <button
                                @click="handleBulkDelete"
                                class="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="批量删除">
                                <Trash2 :size="16" />
                            </button>
                            <button
                                @click="handleBulkPublish"
                                class="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                title="批量发布">
                                <CheckCircle :size="16" />
                            </button>
                        </div>
                    </div>
                </Transition>

                <div class="hidden lg:block w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>

                <!-- Filters Group -->
                <div class="flex items-center gap-3">
                    <!-- Status Filter -->
                    <div
                        class="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <button
                            v-for="status in statuses"
                            :key="status.id"
                            @click="handleStatusChange(status.id)"
                            :class="[
                                activeStatus === status.id
                                    ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-white'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                                'px-4 py-1 rounded-lg text-sm font-medium transition-all',
                            ]">
                            {{ status.label }}
                        </button>
                    </div>

                    <!-- Category Filter -->
                    <div
                        class="relative flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        <USelectMenu
                            v-model="activeCategory"
                            @update:model-value="handleCategoryChange"
                            :items="categoryOptions"
                            value-key="value"
                            label-key="label"
                            :search-input="{ placeholder: '搜索分类...' }"
                            placeholder="所有分类"
                            icon="i-lucide-layers-3"
                            trailing-icon="i-lucide-chevron-down"
                            color="neutral"
                            variant="ghost"
                            :ui="{
                                base: 'shadow-none focus:bg-transparent focus-visible:ring-0 focus-visible:shadow-none',
                            }"
                            :class="[
                                'w-[172px]',
                                activeCategory !== 'all' ? 'rounded-lg bg-slate-100/90 dark:bg-slate-800' : '',
                            ]">
                            <template #item="{ item }">
                                <div
                                    class="w-full flex items-center justify-between gap-3 rounded-lg px-1.5 py-1 transition-colors"
                                    :class="
                                        item.value === activeCategory
                                            ? 'bg-slate-100 dark:bg-slate-800'
                                            : item.value === 'all'
                                              ? 'bg-brand-50/80 dark:bg-brand-900/20'
                                              : ''
                                    ">
                                    <span class="flex items-center gap-2 min-w-0">
                                        <Layers
                                            v-if="item.value === 'all'"
                                            :size="13"
                                            class="text-brand-600 dark:text-brand-300 shrink-0" />
                                        <span
                                            class="truncate"
                                            :class="
                                                item.value === 'all'
                                                    ? 'font-semibold text-brand-700 dark:text-brand-300'
                                                    : 'font-medium text-slate-700 dark:text-slate-200'
                                            ">
                                            {{ item.label }}
                                        </span>
                                    </span>
                                    <span
                                        class="h-5 min-w-6 px-1.5 inline-flex items-center justify-center rounded text-xs font-medium"
                                        :class="
                                            item.value === activeCategory
                                                ? 'bg-brand-600 text-white dark:bg-brand-500'
                                                : item.value === 'all'
                                                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                        ">
                                        {{ item.count }}
                                    </span>
                                </div>
                            </template>
                        </USelectMenu>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content Table -->
        <div
            class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden paper-texture">
            <div v-if="posts.length > 0" class="overflow-x-auto">
                <table class="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr
                            class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm">
                            <th class="py-4 px-6 w-12">
                                <input
                                    type="checkbox"
                                    :checked="isAllSelected"
                                    @change="toggleSelectAll"
                                    class="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 transition-colors" />
                            </th>
                            <th class="py-4 px-4">文章内容</th>
                            <th class="py-4 px-4 text-center">分类</th>
                            <th class="py-4 px-4 text-center">互动统计</th>
                            <th class="py-4 px-4">最后更新</th>
                            <th class="py-4 px-4">发布状态</th>
                            <th class="py-4 px-8 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 dark:divide-slate-800/50">
                        <tr
                            v-for="post in posts"
                            :key="post.id"
                            class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300"
                            :class="{ 'bg-brand-50/30 dark:bg-brand-900/10': selectedIds.includes(post.id) }">
                            <td class="py-6 px-6">
                                <input
                                    type="checkbox"
                                    v-model="selectedIds"
                                    :value="post.id"
                                    class="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500" />
                            </td>
                            <td class="py-6 px-4">
                                <div class="flex items-center gap-4">
                                    <!-- Thumbnail Placeholder -->
                                    <div
                                        class="w-16 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200/50 dark:border-slate-700/50">
                                        <img
                                            v-if="post.coverImageUrl"
                                            :src="post.coverImageUrl"
                                            class="w-full h-full object-cover" />
                                        <div
                                            v-else
                                            class="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon :size="20" />
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-0.5 min-w-0">
                                        <span
                                            class="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors cursor-pointer truncate">
                                            {{ post.title }}
                                        </span>
                                        <span class="text-xs text-slate-400 line-clamp-1 italic">{{
                                            post.excerpt || '暂无摘要描述...'
                                        }}</span>
                                    </div>
                                </div>
                            </td>
                            <td class="py-6 px-4 text-center">
                                <span
                                    class="inline-block text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 rounded-lg border border-brand-100 dark:border-brand-900/30">
                                    {{ post.category }}
                                </span>
                            </td>
                            <td class="py-6 px-4 text-center">
                                <div class="inline-flex items-center justify-center gap-3 whitespace-nowrap">
                                    <div
                                        class="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 text-slate-500 dark:bg-slate-800 dark:text-slate-300 transition-colors group-hover:text-slate-900 dark:group-hover:text-slate-100">
                                        <div
                                            class="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 shrink-0">
                                            <MessageSquare :size="12" />
                                        </div>
                                        <span class="text-sm font-bold">{{ post.commentsCount }}</span>
                                    </div>
                                    <div
                                        class="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 text-slate-400 dark:bg-slate-800 dark:text-slate-400 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-200">
                                        <div
                                            class="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 shrink-0">
                                            <Heart :size="12" />
                                        </div>
                                        <span class="text-sm">{{ post.likesCount }}</span>
                                    </div>
                                    <div
                                        class="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 text-slate-400 dark:bg-slate-800 dark:text-slate-400 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-200">
                                        <div
                                            class="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 shrink-0">
                                            <Eye :size="12" />
                                        </div>
                                        <span class="text-sm">{{ post.viewsCount }}</span>
                                    </div>
                                </div>
                            </td>
                            <td class="py-6 px-4">
                                <div class="flex flex-col">
                                    <span class="text-sm font-bold text-slate-900 dark:text-slate-300">{{
                                        post.updatedAt.split(' ')[0]
                                    }}</span>
                                    <span class="text-xs text-slate-400 mt-1">{{ post.updatedAt.split(' ')[1] }}</span>
                                </div>
                            </td>
                            <td class="py-6 px-4">
                                <div class="flex items-center gap-2.5">
                                    <div
                                        :class="[
                                            post.status === 'published' ? 'bg-green-500' : 'bg-yellow-500',
                                            'w-2 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.3)]',
                                        ]" />
                                    <span
                                        :class="[
                                            post.status === 'published'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-yellow-600 dark:text-yellow-400',
                                            'text-xs font-bold',
                                        ]">
                                        {{ post.status === 'published' ? '已发布' : '草稿箱' }}
                                    </span>
                                </div>
                            </td>
                            <td class="py-6 px-8 text-right">
                                <div class="flex items-center justify-end gap-1 sm:gap-2">
                                    <NuxtLink
                                        :to="{ path: '/admin/posts/new', query: { id: post.id } }"
                                        class="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-all"
                                        title="编辑文章">
                                        <Edit3 :size="16" />
                                    </NuxtLink>
                                    <button
                                        type="button"
                                        @click="previewPost(post.identifier)"
                                        class="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                        title="预览页面">
                                        <ExternalLink :size="16" />
                                    </button>
                                    <div class="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-1" />
                                    <button
                                        @click="handleDelete(post.id)"
                                        class="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                        title="删除文章">
                                        <Trash2 :size="16" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Empty State -->
            <div v-else class="py-20 flex flex-col items-center justify-center text-center">
                <div
                    class="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] text-slate-300 dark:text-slate-700 mb-6">
                    <FileX :size="64" />
                </div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white font-serif">未找到相关文章</h3>
                <p class="text-slate-500 mt-2 max-w-xs">尝试调整您的搜索关键词或过滤条件，或者发布一篇新文章。</p>
                <button @click="resetFilters" class="mt-6 text-sm font-bold text-brand-600 hover:underline">
                    重置所有过滤条件
                </button>
            </div>

            <!-- Pagination -->
            <div
                v-if="posts.length > 0"
                class="px-4 sm:px-8 py-6 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p
                    class="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">
                    显示 <span class="text-slate-900 dark:text-white">{{ currentRangeStart }}-{{ currentRangeEnd }}</span> 条，共
                    <span class="text-slate-900 dark:text-white">{{ totalPosts }}</span> 条结果
                </p>
                <PaginationNav
                    :current-page="currentPage"
                    :total-items="totalPosts"
                    :items-per-page="pageSize"
                    @page-change="handlePageChange" />
            </div>
        </div>
    </div>

    <!-- Confirm Dialog -->
    <BaseConfirm
        v-model="confirmState.show"
        :title="confirmState.title"
        :message="confirmState.message"
        :type="confirmState.type"
        @confirm="confirmState.onConfirm" />
</template>

<script setup lang="ts">
import BaseConfirm from '~/components/BaseConfirm.vue';
import { useAppToast } from '~/composables/useAppToast';
import { listPostCategories } from '~/services/admin-post-category';
import type { AdminPostCategoryItem } from '~/types/admin-post-category';
import type { AdminPostListItem, AdminPostListResponse } from '~/types/post';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    ExternalLink,
    MessageSquare,
    Heart,
    Eye,
    Layers,
    Image as ImageIcon,
    CheckCircle,
    FileX,
} from 'lucide-vue-next';

definePageMeta({
    layout: 'admin',
});

const { addToast } = useAppToast();

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

// Confirm state
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

function getRequestErrorMessage(error: unknown, fallbackMessage: string) {
    const requestError = error as {
        data?: {
            statusMessage?: string;
            message?: string;
        };
        statusMessage?: string;
        message?: string;
    };

    return (
        requestError.data?.statusMessage ||
        requestError.data?.message ||
        requestError.statusMessage ||
        requestError.message ||
        fallbackMessage
    );
}

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
            addToast(getRequestErrorMessage(error, '文章列表加载失败'), 'error');
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
            addToast(getRequestErrorMessage(error, '分类列表加载失败，当前改为文章数据统计'), 'warning');
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

function handleCategoryChange(category: string) {
    activeCategory.value = category;
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
                    addToast(getRequestErrorMessage(error, '文章删除失败'), 'error');
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
                    addToast(getRequestErrorMessage(error, '批量删除失败'), 'error');
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
                    addToast(getRequestErrorMessage(error, '批量发布失败'), 'error');
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

<style scoped>
.paper-texture {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.05' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
}

.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>

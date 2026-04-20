<template>
  <div class="space-y-8 pb-20">
    <header class="space-y-3">
      <h1 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-serif">
        文章分类
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        统一管理文章分类名称，并维护分类与文章数量统计。
      </p>
    </header>

    <section class="grid gap-4 sm:grid-cols-2">
      <article class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">分类总数</p>
        <p class="mt-3 text-3xl font-black text-slate-900 dark:text-white">{{ categories.length }}</p>
      </article>
      <article class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">文章总量</p>
        <p class="mt-3 text-3xl font-black text-slate-900 dark:text-white">{{ totalPostCount }}</p>
      </article>
    </section>

    <section class="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          v-model="newCategoryName"
          type="text"
          placeholder="输入新分类名称"
          class="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950"
          @keydown.enter.prevent="handleCreateCategory"
        >
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="submittingCreate"
          @click="handleCreateCategory"
        >
          {{ submittingCreate ? '创建中...' : '新建分类' }}
        </button>
      </div>
    </section>

    <section class="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table v-if="categories.length > 0" class="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr class="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            <th class="px-6 py-4">分类名称</th>
            <th class="px-4 py-4 text-center">文章数量</th>
            <th class="px-4 py-4 text-center">草稿数量</th>
            <th class="px-4 py-4 text-center">发布时间文章</th>
            <th class="px-4 py-4">更新时间</th>
            <th class="px-6 py-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50 dark:divide-slate-800/70">
          <tr
            v-for="category in categories"
            :key="category.id"
            class="hover:bg-slate-50/70 dark:hover:bg-slate-800/20"
          >
            <td class="px-6 py-5 align-middle">
              <div v-if="editingCategoryId === category.id" class="flex items-center gap-2">
                <input
                  v-model="editingCategoryName"
                  type="text"
                  class="h-9 w-52 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-slate-950"
                  @keydown.enter.prevent="handleRenameCategory(category.id)"
                >
                <button
                  type="button"
                  class="inline-flex h-9 items-center rounded-lg bg-brand-600 px-3 text-xs font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="submittingRename"
                  @click="handleRenameCategory(category.id)"
                >
                  保存
                </button>
                <button
                  type="button"
                  class="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  @click="cancelRename"
                >
                  取消
                </button>
              </div>
              <p v-else class="text-sm font-bold text-slate-900 dark:text-white">
                {{ category.name }}
              </p>
            </td>
            <td class="px-4 py-5 text-center text-sm text-slate-600 dark:text-slate-300">{{ category.postCount }}</td>
            <td class="px-4 py-5 text-center text-sm text-slate-600 dark:text-slate-300">{{ category.draftPostCount }}</td>
            <td class="px-4 py-5 text-center text-sm text-slate-600 dark:text-slate-300">{{ category.publishedPostCount }}</td>
            <td class="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">{{ category.updatedAt }}</td>
            <td class="px-6 py-5">
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  @click="startRename(category)"
                >
                  重命名
                </button>
                <button
                  type="button"
                  class="inline-flex h-8 items-center rounded-lg bg-rose-600 px-3 text-xs font-bold text-white transition-colors hover:bg-rose-700"
                  @click="openDeleteDialog(category.id)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="px-6 py-16 text-center">
        <p class="text-base font-bold text-slate-900 dark:text-white">当前还没有分类</p>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">创建分类后可在文章编辑页面选择使用。</p>
      </div>
    </section>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="pendingDeleteCategoryId"
        class="fixed inset-0 z-[85] bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
        @click.self="closeDeleteDialog"
      >
        <div class="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <h2 class="text-xl font-black text-slate-900 dark:text-white">删除分类</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            删除前需保证分类下没有文章，当前操作将移除该分类记录。
          </p>
          <div class="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              class="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              @click="closeDeleteDialog"
            >
              取消
            </button>
            <button
              type="button"
              class="inline-flex h-10 items-center rounded-xl bg-rose-600 px-4 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="submittingDelete"
              @click="handleDeleteCategory"
            >
              {{ submittingDelete ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  createPostCategory,
  deletePostCategory,
  listPostCategories,
  renamePostCategory,
} from '~/services/admin-post-category';
import type { AdminPostCategoryItem } from '~/types/admin-post-category';
import { resolveRequestErrorMessage } from '~/utils/request-error';

definePageMeta({
  layout: 'admin',
});

const { addToast } = useAppToast();
const categories = ref<AdminPostCategoryItem[]>([]);
const newCategoryName = ref('');
const editingCategoryId = ref('');
const editingCategoryName = ref('');
const pendingDeleteCategoryId = ref('');
const submittingCreate = ref(false);
const submittingRename = ref(false);
const submittingDelete = ref(false);

const totalPostCount = computed(() => categories.value.reduce((sum, item) => sum + item.postCount, 0));


async function refreshCategories() {
  try {
    categories.value = await listPostCategories();
  } catch (error) {
    addToast(resolveRequestErrorMessage(error, '分类列表加载失败'), 'error');
  }
}

function startRename(category: AdminPostCategoryItem) {
  editingCategoryId.value = category.id;
  editingCategoryName.value = category.name;
}

function cancelRename() {
  editingCategoryId.value = '';
  editingCategoryName.value = '';
}

function openDeleteDialog(categoryId: string) {
  pendingDeleteCategoryId.value = categoryId;
}

function closeDeleteDialog() {
  pendingDeleteCategoryId.value = '';
}

async function handleCreateCategory() {
  const name = newCategoryName.value.trim();
  if (!name) {
    addToast('分类名称不能为空', 'warning');
    return;
  }

  submittingCreate.value = true;
  try {
    await createPostCategory(name);
    newCategoryName.value = '';
    await refreshCategories();
    addToast('分类已创建', 'success');
  } catch (error) {
    addToast(resolveRequestErrorMessage(error, '分类创建失败'), 'error');
  } finally {
    submittingCreate.value = false;
  }
}

async function handleRenameCategory(categoryId: string) {
  const name = editingCategoryName.value.trim();
  if (!name) {
    addToast('分类名称不能为空', 'warning');
    return;
  }

  submittingRename.value = true;
  try {
    await renamePostCategory(categoryId, name);
    cancelRename();
    await refreshCategories();
    addToast('分类名称已更新', 'success');
  } catch (error) {
    addToast(resolveRequestErrorMessage(error, '分类重命名失败'), 'error');
  } finally {
    submittingRename.value = false;
  }
}

async function handleDeleteCategory() {
  const categoryId = pendingDeleteCategoryId.value;
  if (!categoryId) {
    return;
  }

  submittingDelete.value = true;
  try {
    await deletePostCategory(categoryId);
    closeDeleteDialog();
    await refreshCategories();
    addToast('分类已删除', 'success');
  } catch (error) {
    addToast(resolveRequestErrorMessage(error, '分类删除失败'), 'error');
  } finally {
    submittingDelete.value = false;
  }
}

onMounted(async () => {
  await refreshCategories();
});
</script>

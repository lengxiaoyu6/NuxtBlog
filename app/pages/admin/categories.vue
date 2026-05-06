<template>
  <div class="space-y-6 pb-20">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UCard :ui="cardUi">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">分类总数</p>
            <p class="mt-2 text-3xl font-black text-slate-900 dark:text-white">{{ categories.length }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-2xl bg-brand-600">
            <UIcon name="i-lucide-tags" class="size-5 text-white" />
          </div>
        </div>
      </UCard>
      <UCard :ui="cardUi">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">文章总量</p>
            <p class="mt-2 text-3xl font-black text-slate-900 dark:text-white">{{ totalPostCount }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-2xl bg-slate-600">
            <UIcon name="i-lucide-file-text" class="size-5 text-white" />
          </div>
        </div>
      </UCard>
      <UCard :ui="cardUi">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">已发布文章</p>
            <p class="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-300">{{ publishedPostCount }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-2xl bg-emerald-500">
            <UIcon name="i-lucide-check-circle" class="size-5 text-white" />
          </div>
        </div>
      </UCard>
      <UCard :ui="cardUi">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">草稿文章</p>
            <p class="mt-2 text-3xl font-black text-amber-600 dark:text-amber-300">{{ draftPostCount }}</p>
          </div>
          <div class="grid size-11 place-items-center rounded-2xl bg-amber-500">
            <UIcon name="i-lucide-file-pen-line" class="size-5 text-white" />
          </div>
        </div>
      </UCard>
    </div>

    <UCard :ui="cardUi">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-2">
          <h1 class="font-serif text-3xl font-black tracking-tight text-slate-900 dark:text-white">文章分类</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">统一管理文章分类名称，并维护分类与文章数量统计。</p>
        </div>
        <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] xl:w-[34rem]">
          <UInput
            v-model="newCategoryName"
            icon="i-lucide-tag"
            size="lg"
            placeholder="输入新分类名称"
            @keydown.enter.prevent="handleCreateCategory"
          />
          <UButton size="lg" icon="i-lucide-plus" :loading="submittingCreate" class="justify-center" @click="handleCreateCategory">
            新建分类
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard :ui="{ ...cardUi, body: 'p-0' }">
      <template v-if="categories.length > 0">
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                <th class="px-6 py-4">分类名称</th>
                <th class="px-4 py-4 text-center">文章数量</th>
                <th class="px-4 py-4 text-center">草稿数量</th>
                <th class="px-4 py-4 text-center">已发布</th>
                <th class="px-4 py-4">更新时间</th>
                <th class="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-800/70">
              <tr v-for="category in categories" :key="category.id" class="hover:bg-slate-50/70 dark:hover:bg-slate-900/50">
                <td class="px-6 py-5 align-middle">
                  <div v-if="editingCategoryId === category.id" class="flex items-center gap-2">
                    <UInput v-model="editingCategoryName" size="sm" class="w-56" @keydown.enter.prevent="handleRenameCategory(category.id)" />
                    <UButton size="sm" :loading="submittingRename" @click="handleRenameCategory(category.id)">保存</UButton>
                    <UButton color="neutral" variant="soft" size="sm" @click="cancelRename">取消</UButton>
                  </div>
                  <div v-else class="flex items-center gap-3">
                    <div class="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-300">
                      <UIcon name="i-lucide-tag" class="size-4" />
                    </div>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">{{ category.name }}</p>
                  </div>
                </td>
                <td class="px-4 py-5 text-center"><UBadge color="neutral" variant="soft">{{ category.postCount }}</UBadge></td>
                <td class="px-4 py-5 text-center"><UBadge color="warning" variant="soft">{{ category.draftPostCount }}</UBadge></td>
                <td class="px-4 py-5 text-center"><UBadge color="success" variant="soft">{{ category.publishedPostCount }}</UBadge></td>
                <td class="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">{{ category.updatedAt }}</td>
                <td class="px-6 py-5">
                  <div class="flex justify-end gap-2">
                    <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-pencil" @click="startRename(category)">重命名</UButton>
                    <UButton color="error" variant="soft" size="sm" icon="i-lucide-trash-2" @click="openDeleteDialog(category.id)">删除</UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
          <article v-for="category in categories" :key="category.id" class="space-y-4 p-4">
            <div v-if="editingCategoryId === category.id" class="space-y-3">
              <UInput v-model="editingCategoryName" @keydown.enter.prevent="handleRenameCategory(category.id)" />
              <div class="grid grid-cols-2 gap-2">
                <UButton :loading="submittingRename" class="justify-center" @click="handleRenameCategory(category.id)">保存</UButton>
                <UButton color="neutral" variant="soft" class="justify-center" @click="cancelRename">取消</UButton>
              </div>
            </div>
            <template v-else>
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="text-sm font-bold text-slate-900 dark:text-white">{{ category.name }}</h2>
                  <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ category.updatedAt }}</p>
                </div>
                <UBadge color="neutral" variant="soft">{{ category.postCount }} 篇</UBadge>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span class="rounded-xl bg-slate-50 py-2 text-center dark:bg-slate-900">草稿 {{ category.draftPostCount }}</span>
                <span class="rounded-xl bg-slate-50 py-2 text-center dark:bg-slate-900">已发布 {{ category.publishedPostCount }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-pencil" class="justify-center" @click="startRename(category)">重命名</UButton>
                <UButton color="error" variant="soft" size="sm" icon="i-lucide-trash-2" class="justify-center" @click="openDeleteDialog(category.id)">删除</UButton>
              </div>
            </template>
          </article>
        </div>
      </template>

      <div v-else class="px-6 py-16 text-center">
        <UIcon name="i-lucide-tags" class="mx-auto size-10 text-slate-300 dark:text-slate-600" />
        <p class="mt-5 text-base font-bold text-slate-900 dark:text-white">当前还没有分类</p>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">创建分类后可在文章编辑页面选择使用。</p>
      </div>
    </UCard>

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
        <UCard :ui="cardUi" class="mx-auto max-w-md">
          <div class="space-y-5">
            <div class="flex items-start gap-3">
              <div class="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
                <UIcon name="i-lucide-trash-2" class="size-5" />
              </div>
              <div>
                <h2 class="text-xl font-black text-slate-900 dark:text-white">删除分类</h2>
                <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">删除前需保证分类下没有文章，当前操作将移除该分类记录。</p>
              </div>
            </div>
            <div class="flex items-center justify-end gap-3">
              <UButton color="neutral" variant="soft" @click="closeDeleteDialog">取消</UButton>
              <UButton color="error" :loading="submittingDelete" @click="handleDeleteCategory">确认删除</UButton>
            </div>
          </div>
        </UCard>
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
const cardUi = { root: 'rounded-[1.75rem] border-slate-200 dark:border-slate-800 overflow-hidden', body: 'p-5 sm:p-6' };
const categories = ref<AdminPostCategoryItem[]>([]);
const newCategoryName = ref('');
const editingCategoryId = ref('');
const editingCategoryName = ref('');
const pendingDeleteCategoryId = ref('');
const submittingCreate = ref(false);
const submittingRename = ref(false);
const submittingDelete = ref(false);

const totalPostCount = computed(() => categories.value.reduce((sum, item) => sum + item.postCount, 0));
const draftPostCount = computed(() => categories.value.reduce((sum, item) => sum + item.draftPostCount, 0));
const publishedPostCount = computed(() => categories.value.reduce((sum, item) => sum + item.publishedPostCount, 0));

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

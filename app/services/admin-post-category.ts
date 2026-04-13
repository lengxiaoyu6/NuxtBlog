import type { AdminPostCategoryItem } from '~/types/admin-post-category';

export async function listPostCategories() {
  return await $fetch<AdminPostCategoryItem[]>('/api/admin/post-categories');
}

export async function createPostCategory(name: string) {
  return await $fetch<AdminPostCategoryItem>('/api/admin/post-categories', {
    method: 'POST',
    body: {
      name,
    },
  });
}

export async function renamePostCategory(categoryId: string, name: string) {
  return await $fetch<AdminPostCategoryItem>(`/api/admin/post-categories/${categoryId}`, {
    method: 'PATCH',
    body: {
      name,
    },
  });
}

export async function deletePostCategory(categoryId: string) {
  return await $fetch<{ id: string }>(`/api/admin/post-categories/${categoryId}`, {
    method: 'DELETE',
  });
}

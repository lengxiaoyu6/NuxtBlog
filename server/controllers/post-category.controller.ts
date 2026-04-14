import type { H3Event } from 'h3';
import type {
  AdminPostCategoryCreateInput,
  AdminPostCategoryRenameInput,
} from '../../shared/types/post-category';
import {
  createAdminPostCategory,
  deleteAdminPostCategory,
  readAdminPostCategories,
  renameAdminPostCategory,
} from '../services/post-category.service';
import { requireAdminSession } from '../utils/require-admin-session';

export const postCategoryController = {
  async getAdminPostCategories(event: H3Event) {
    await requireAdminSession(event);
    return await readAdminPostCategories();
  },
  async createAdminPostCategory(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<AdminPostCategoryCreateInput | null>(event);
    return await createAdminPostCategory(body);
  },
  async renameAdminPostCategory(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    const body = await readBody<AdminPostCategoryRenameInput | null>(event);
    return await renameAdminPostCategory(id, body);
  },
  async deleteAdminPostCategory(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    return await deleteAdminPostCategory(id);
  },
};

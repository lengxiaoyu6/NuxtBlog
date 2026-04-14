import type { H3Event } from 'h3';
import type { AdminFriendLinkSaveInput, FriendLinkApplicationSubmitInput } from '../../shared/types/friend-link';
import {
  createAdminFriendLink,
  createFriendLinkApplication,
  deleteAdminFriendLink,
  readAdminFriendLinks,
  updateAdminFriendLink,
} from '../services/friend-link.service';
import { requireAdminSession } from '../utils/require-admin-session';

export const friendLinkController = {
  async createPublicFriendLinkApplication(event: H3Event) {
    const body = await readBody<FriendLinkApplicationSubmitInput>(event);
    return await createFriendLinkApplication(body);
  },
  async getAdminFriendLinks(event: H3Event) {
    await requireAdminSession(event);
    return await readAdminFriendLinks();
  },
  async createAdminFriendLink(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<AdminFriendLinkSaveInput>(event);
    return await createAdminFriendLink(body);
  },
  async updateAdminFriendLink(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    const body = await readBody<AdminFriendLinkSaveInput>(event);
    return await updateAdminFriendLink(id, body);
  },
  async deleteAdminFriendLink(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    return await deleteAdminFriendLink(id);
  },
};

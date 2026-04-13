import type { H3Event } from 'h3';
import type { GuestbookEntrySubmitInput, GuestbookStatusUpdateInput } from '../../shared/types/guestbook';
import {
  createGuestbookEntry,
  readAdminGuestbookComments,
  readPublicGuestbookEntries,
  updateGuestbookEntryStatus,
} from '../services/guestbook.service';
import { requireAdminSession } from '../utils/require-admin-session';

export const guestbookController = {
  async getPublicGuestbookEntries() {
    return await readPublicGuestbookEntries();
  },
  async createPublicGuestbookEntry(event: H3Event) {
    const body = await readBody<GuestbookEntrySubmitInput>(event);
    return await createGuestbookEntry(body);
  },
  async getAdminGuestbookComments(event: H3Event) {
    await requireAdminSession(event);
    return await readAdminGuestbookComments();
  },
  async updateAdminGuestbookCommentStatus(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    const body = await readBody<GuestbookStatusUpdateInput>(event);
    return await updateGuestbookEntryStatus(id, body.status);
  },
};

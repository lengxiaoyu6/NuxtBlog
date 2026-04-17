import type { H3Event } from 'h3';
import type { GuestbookEntrySubmitInput, GuestbookStatusUpdateInput } from '../../shared/types/guestbook';
import {
  createGuestbookEntry,
  readAdminGuestbookComments,
  readPublicGuestbookEntries,
  updateGuestbookEntryStatus,
} from '../services/guestbook.service';
import { useSecurityRequestService } from '../services/security-request.service';
import { toSecurityRateLimitPolicy } from '../services/security-settings.service';
import { readSiteSecuritySettings } from '../services/site-settings.service';
import { requireAdminSession } from '../utils/require-admin-session';

export const guestbookController = {
  async getPublicGuestbookEntries() {
    return await readPublicGuestbookEntries();
  },
  async createPublicGuestbookEntry(event: H3Event) {
    const body = await readBody<GuestbookEntrySubmitInput>(event);
    const securitySettings = await readSiteSecuritySettings();
    const securityRequestService = useSecurityRequestService();

    await securityRequestService.consumeRateLimit(event, {
      action: 'guestbook_submit',
      policy: toSecurityRateLimitPolicy(securitySettings.guestbook.rateLimit),
      blockedMessage: '留言提交过于频繁，请稍后再试',
    });
    await securityRequestService.verifyTurnstile(event, {
      enabled: securitySettings.guestbook.captchaEnabled,
      token: body?.turnstileToken,
    });

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

import type { H3Event } from 'h3';
import type { AdminFriendLinkSaveInput, FriendLinkApplicationSubmitInput } from '../../shared/types/friend-link';
import {
  createAdminFriendLink,
  createFriendLinkApplication,
  deleteAdminFriendLink,
  readAdminFriendLinks,
  updateAdminFriendLink,
} from '../services/friend-link.service';
import { useSecurityRequestService } from '../services/security-request.service';
import { toSecurityRateLimitPolicy } from '../services/security-settings.service';
import { readSiteSecuritySettings } from '../services/site-settings.service';
import { requireAdminSession } from '../utils/require-admin-session';

export const friendLinkController = {
  async createPublicFriendLinkApplication(event: H3Event) {
    const body = await readBody<FriendLinkApplicationSubmitInput>(event);
    const securitySettings = await readSiteSecuritySettings();
    const securityRequestService = useSecurityRequestService();

    await securityRequestService.consumeRateLimit(event, {
      action: 'friend_link_application_submit',
      policy: toSecurityRateLimitPolicy(securitySettings.linkApplications.rateLimit),
      blockedMessage: '友链申请提交过于频繁，请稍后再试',
    });
    await securityRequestService.verifyTurnstile(event, {
      enabled: securitySettings.linkApplications.captchaEnabled,
      token: body?.turnstileToken,
    });

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

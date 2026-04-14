import type { H3Event } from 'h3';
import type { AdminSettingsForm } from '../../app/types/admin-settings';
import { readPublicSiteSettings, readSiteSettings, saveSiteSettings } from '../services/site-settings.service';
import { requireAdminSession } from '../utils/require-admin-session';

export const siteSettingsController = {
  async getSiteSettings(event: H3Event) {
    await requireAdminSession(event);
    return await readSiteSettings();
  },
  async updateSiteSettings(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<AdminSettingsForm>(event);
    return await saveSiteSettings(body);
  },
  async getPublicSiteSettings() {
    return await readPublicSiteSettings();
  },
};

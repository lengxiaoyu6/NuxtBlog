import type { H3Event } from 'h3';
import type {
  AboutPageSettings,
  GuestbookPageSettings,
  LinksPageSettings,
  ProjectsPageSettings,
} from '../../app/types/page-settings';
import {
  readAboutPageSettings,
  readGuestbookPageSettings,
  readLinksPageSettings,
  readPageSettings,
  readProjectsPageSettings,
  readPublicPageSettings,
  saveAboutPageSettings,
  saveGuestbookPageSettings,
  saveLinksPageSettings,
  saveProjectsPageSettings,
} from '../services/page-settings.service';
import { requireAdminSession } from '../utils/require-admin-session';

export const pageSettingsController = {
  async getPageSettings(event: H3Event) {
    await requireAdminSession(event);
    return await readPageSettings();
  },
  async getAboutPageSettings(event: H3Event) {
    await requireAdminSession(event);
    return await readAboutPageSettings();
  },
  async updateAboutPageSettings(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<AboutPageSettings>(event);
    return await saveAboutPageSettings(body);
  },
  async getGuestbookPageSettings(event: H3Event) {
    await requireAdminSession(event);
    return await readGuestbookPageSettings();
  },
  async updateGuestbookPageSettings(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<GuestbookPageSettings>(event);
    return await saveGuestbookPageSettings(body);
  },
  async getLinksPageSettings(event: H3Event) {
    await requireAdminSession(event);
    return await readLinksPageSettings();
  },
  async updateLinksPageSettings(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<LinksPageSettings>(event);
    return await saveLinksPageSettings(body);
  },
  async getProjectsPageSettings(event: H3Event) {
    await requireAdminSession(event);
    return await readProjectsPageSettings();
  },
  async updateProjectsPageSettings(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<ProjectsPageSettings>(event);
    return await saveProjectsPageSettings(body);
  },
  async getPublicPageSettings() {
    return await readPublicPageSettings();
  },
};

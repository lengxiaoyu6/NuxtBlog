import { siteSettingsController } from '../../controllers/site-settings.controller';

export default defineEventHandler((event) => siteSettingsController.updateSiteSettings(event));

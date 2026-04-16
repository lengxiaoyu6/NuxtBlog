import { siteSettingsController } from '../../controllers/site-settings.controller';

export default defineEventHandler(() => siteSettingsController.getPublicSecurityConfig());

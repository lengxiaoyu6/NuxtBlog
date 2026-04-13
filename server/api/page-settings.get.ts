import { pageSettingsController } from '../controllers/page-settings.controller';

export default defineEventHandler(() => pageSettingsController.getPublicPageSettings());

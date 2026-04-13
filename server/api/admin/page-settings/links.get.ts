import { pageSettingsController } from '../../../controllers/page-settings.controller';

export default defineEventHandler((event) => pageSettingsController.getLinksPageSettings(event));

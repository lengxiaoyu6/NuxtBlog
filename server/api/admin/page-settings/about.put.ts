import { pageSettingsController } from '../../../controllers/page-settings.controller';

export default defineEventHandler((event) => pageSettingsController.updateAboutPageSettings(event));

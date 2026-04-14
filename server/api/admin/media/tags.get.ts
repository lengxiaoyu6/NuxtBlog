import { mediaController } from '../../../controllers/media.controller';

export default defineEventHandler((event) => mediaController.getAdminMediaTags(event));

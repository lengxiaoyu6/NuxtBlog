import { mediaController } from '../../../../controllers/media.controller';

export default defineEventHandler((event) => mediaController.renameAdminMediaFolder(event));

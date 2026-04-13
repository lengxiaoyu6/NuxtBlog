import { mediaController } from '../../../controllers/media.controller';

export default defineEventHandler((event) => mediaController.getAdminMediaFolders(event));

import { mediaController } from '../../../../../controllers/media.controller';

export default defineEventHandler((event) => mediaController.renameAdminMediaAsset(event));

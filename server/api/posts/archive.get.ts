import { postController } from '../../controllers/post.controller';

export default defineEventHandler(() => postController.getPublicPostArchive());

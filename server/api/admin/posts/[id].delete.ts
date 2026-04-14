import { postController } from '../../../controllers/post.controller';

export default defineEventHandler((event) => postController.deleteAdminPost(event));

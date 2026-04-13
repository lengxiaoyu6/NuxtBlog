import { postCommentController } from '../../../controllers/post-comment.controller';

export default defineEventHandler((event) => postCommentController.createPublicPostComment(event));

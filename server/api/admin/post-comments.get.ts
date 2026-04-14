import { postCommentController } from '../../controllers/post-comment.controller';

const readAdminPostComments = (event: Parameters<typeof postCommentController.getAdminPostComments>[0]) =>
  postCommentController.getAdminPostComments(event);

export default defineEventHandler(readAdminPostComments);

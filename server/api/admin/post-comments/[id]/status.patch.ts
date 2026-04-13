import { postCommentController } from '../../../../controllers/post-comment.controller';

const updatePostCommentStatus = (event: Parameters<typeof postCommentController.updateAdminPostCommentStatus>[0]) =>
  postCommentController.updateAdminPostCommentStatus(event);

export default defineEventHandler(updatePostCommentStatus);

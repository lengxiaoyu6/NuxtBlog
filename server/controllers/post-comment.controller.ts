import type { H3Event } from 'h3';
import type {
  AdminPostCommentListQuery,
  PostCommentStatusUpdateInput,
  PostCommentSubmitInput,
} from '../../shared/types/post-comment';
import {
  createPostComment,
  readAdminPostComments,
  readPublicPostComments,
  updatePostCommentStatus,
} from '../services/post-comment.service';
import { requireAdminSession } from '../utils/require-admin-session';

export const postCommentController = {
  async getPublicPostComments(event: H3Event) {
    const identifier = getRouterParam(event, 'identifier') || '';
    return await readPublicPostComments(identifier);
  },
  async createPublicPostComment(event: H3Event) {
    const identifier = getRouterParam(event, 'identifier') || '';
    const body = await readBody<PostCommentSubmitInput | null>(event);
    return await createPostComment(identifier, body);
  },
  async getAdminPostComments(event: H3Event) {
    await requireAdminSession(event);
    const query = getQuery(event) as AdminPostCommentListQuery;
    return await readAdminPostComments(query);
  },
  async updateAdminPostCommentStatus(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    const body = await readBody<PostCommentStatusUpdateInput>(event);
    return await updatePostCommentStatus(id, body.status);
  },
};

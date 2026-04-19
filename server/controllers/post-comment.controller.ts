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
import { useSecurityRequestService } from '../services/security-request.service';
import { toSecurityRateLimitPolicy } from '../services/security-settings.service';
import { readSiteSecuritySettings } from '../services/site-settings.service';
import { requireAdminSession } from '../utils/require-admin-session';

export const postCommentController = {
  async getPublicPostComments(event: H3Event) {
    const identifier = getRouterParam(event, 'identifier') || '';
    return await readPublicPostComments(identifier);
  },
  async createPublicPostComment(event: H3Event) {
    const identifier = getRouterParam(event, 'identifier') || '';
    const body = await readBody<PostCommentSubmitInput | null>(event);
    const securitySettings = await readSiteSecuritySettings();
    const securityRequestService = useSecurityRequestService();

    const requestContext = await securityRequestService.consumeRateLimit(event, {
      action: 'post_comment_submit',
      policy: toSecurityRateLimitPolicy(securitySettings.comments.rateLimit),
      blockedMessage: '评论提交过于频繁，请稍后再试',
    });
    await securityRequestService.verifyTurnstile(event, {
      enabled: securitySettings.comments.captchaEnabled,
      token: body?.turnstileToken,
    });

    return await createPostComment(identifier, body, {
      clientIp: requestContext.ip,
    });
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

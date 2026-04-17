import type { H3Event } from 'h3';
import type { AdminPostBulkPublishInput, AdminPostListQuery, AdminPostUpsertInput, PublicPostListQuery } from '../../shared/types/post';
import {
  bulkPublishAdminPosts as bulkPublishAdminPostsService,
  createAdminPost as createAdminPostService,
  deleteAdminPost as deleteAdminPostService,
  increasePublicPostLikes as increasePublicPostLikesService,
  increasePublicPostViews as increasePublicPostViewsService,
  readAdminDashboardSummary,
  readAdminPostDetail,
  readAdminPosts,
  readPublicPostArchive,
  readPublicPostDetail,
  readPublicPosts,
  updateAdminPost as updateAdminPostService,
} from '../services/post.service';
import { useSecurityRequestService } from '../services/security-request.service';
import { toSecurityRateLimitPolicy } from '../services/security-settings.service';
import { readSiteSecuritySettings } from '../services/site-settings.service';
import { requireAdminSession } from '../utils/require-admin-session';

export const postController = {
  async getAdminDashboardSummary(event: H3Event) {
    await requireAdminSession(event);
    return await readAdminDashboardSummary();
  },
  async getAdminPosts(event: H3Event) {
    await requireAdminSession(event);
    const query = getQuery(event) as AdminPostListQuery;
    return await readAdminPosts(query);
  },
  async createAdminPost(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<AdminPostUpsertInput | null>(event);
    return await createAdminPostService(body);
  },
  async getAdminPostDetail(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    return await readAdminPostDetail(id);
  },
  async updateAdminPost(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    const body = await readBody<AdminPostUpsertInput | null>(event);
    return await updateAdminPostService(id, body);
  },
  async deleteAdminPost(event: H3Event) {
    await requireAdminSession(event);
    const id = getRouterParam(event, 'id') || '';
    return await deleteAdminPostService(id);
  },
  async bulkPublishAdminPosts(event: H3Event) {
    await requireAdminSession(event);
    const body = await readBody<AdminPostBulkPublishInput | null>(event);
    return await bulkPublishAdminPostsService(body?.ids ?? []);
  },
  async getPublicPosts(event: H3Event) {
    const query = getQuery(event) as PublicPostListQuery;
    return await readPublicPosts(query);
  },
  async getPublicPostArchive() {
    return await readPublicPostArchive();
  },
  async getPublicPostDetail(event: H3Event) {
    const identifier = getRouterParam(event, 'identifier') || '';
    return await readPublicPostDetail(identifier);
  },
  async increasePublicPostViews(event: H3Event) {
    const identifier = getRouterParam(event, 'identifier') || '';
    return await increasePublicPostViewsService(identifier);
  },
  async increasePublicPostLikes(event: H3Event) {
    const identifier = getRouterParam(event, 'identifier') || '';
    const securitySettings = await readSiteSecuritySettings();
    const securityRequestService = useSecurityRequestService();

    await securityRequestService.consumeRateLimit(event, {
      action: 'post_like',
      policy: toSecurityRateLimitPolicy(securitySettings.likes.rateLimit),
      blockedMessage: '点赞操作过于频繁，请稍后再试',
    });

    return await increasePublicPostLikesService(identifier);
  },
};

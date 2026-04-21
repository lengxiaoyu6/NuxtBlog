import type { H3Event } from 'h3';
import { readNotificationModuleSettings } from '../../../../services/notification-module.service';
import { requireAdminSession } from '../../../../utils/require-admin-session';

const notificationModuleKey = 'notification-center';

function ensureNotificationSettingsModuleKey(event: H3Event) {
  const moduleKey = getRouterParam(event, 'moduleKey') || '';

  if (moduleKey !== notificationModuleKey) {
    throw createError({
      statusCode: 404,
      statusMessage: '当前模块未提供邮件通知配置接口',
    });
  }
}

export default defineEventHandler(async (event) => {
  await requireAdminSession(event);
  ensureNotificationSettingsModuleKey(event);
  return await readNotificationModuleSettings();
});

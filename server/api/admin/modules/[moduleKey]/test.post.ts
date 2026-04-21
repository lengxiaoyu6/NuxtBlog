import type { H3Event } from 'h3';
import { sendNotificationTestEmail } from '../../../../services/notification-delivery.service';
import { requireAdminSession } from '../../../../utils/require-admin-session';

const notificationModuleKey = 'notification-center';

function ensureNotificationTestModuleKey(event: H3Event) {
  const moduleKey = getRouterParam(event, 'moduleKey') || '';

  if (moduleKey !== notificationModuleKey) {
    throw createError({
      statusCode: 404,
      statusMessage: '当前模块未提供测试邮件接口',
    });
  }
}

export default defineEventHandler(async (event) => {
  await requireAdminSession(event);
  ensureNotificationTestModuleKey(event);
  const body = await readBody<{ recipient?: string }>(event);
  const recipient = typeof body?.recipient === 'string' ? body.recipient : '';

  await sendNotificationTestEmail(recipient);

  return {
    ok: true,
    message: `测试邮件已发送至 ${recipient.trim()}`,
  };
});

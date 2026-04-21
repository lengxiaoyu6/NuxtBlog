import { sendNotificationTestEmail } from '../../../../services/notification-delivery.service';
import { requireAdminSession } from '../../../../utils/require-admin-session';

export default defineEventHandler(async (event) => {
  await requireAdminSession(event);
  const body = await readBody<{ recipient?: string }>(event);
  const recipient = typeof body?.recipient === 'string' ? body.recipient : '';

  await sendNotificationTestEmail(recipient);

  return {
    ok: true,
    message: `测试邮件已发送至 ${recipient.trim()}`,
  };
});

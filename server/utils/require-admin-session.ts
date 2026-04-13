import type { H3Event } from 'h3';
import type { AdminSessionUser } from '../../shared/types/auth';

export async function requireAdminSession(event: H3Event) {
  const userSession = await getUserSession(event);
  const sessionUser = userSession.user as AdminSessionUser | undefined;

  if (!sessionUser) {
    throw createError({
      statusCode: 401,
      statusMessage: '请先登录管理员账号',
    });
  }

  if (sessionUser.mustChangePassword) {
    throw createError({
      statusCode: 409,
      statusMessage: '请先完成首次密码修改',
    });
  }

  return sessionUser;
}

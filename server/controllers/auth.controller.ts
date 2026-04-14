import type { H3Event } from 'h3';
import type { AdminSessionUser } from '../../shared/types/auth';
import { changeAdminPassword, verifyAdminCredentials } from '../services/auth.service';

export const authController = {
  async login(event: H3Event) {
    const body = await readBody<{ username?: string; password?: string }>(event);
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: '用户名和密码不能为空',
      });
    }

    const sessionUser = await verifyAdminCredentials(username, password);

    if (!sessionUser) {
      throw createError({
        statusCode: 401,
        statusMessage: '用户名或密码错误',
      });
    }

    await setUserSession(event, {
      user: sessionUser satisfies AdminSessionUser,
      loggedInAt: Date.now(),
    });

    return {
      ok: true,
      user: sessionUser,
    };
  },
  async logout(event: H3Event) {
    await clearUserSession(event);

    return {
      ok: true,
    };
  },
  async session(event: H3Event) {
    const userSession = await getUserSession(event);

    return {
      loggedIn: Boolean(userSession.user),
      user: (userSession.user ?? null) as AdminSessionUser | null,
    };
  },
  async passwordSetup(event: H3Event) {
    const userSession = await getUserSession(event);
    const sessionUser = userSession.user as AdminSessionUser | undefined;

    if (!sessionUser) {
      throw createError({
        statusCode: 401,
        statusMessage: '请先登录管理员账号',
      });
    }

    if (!sessionUser.mustChangePassword) {
      throw createError({
        statusCode: 409,
        statusMessage: '当前账号已经完成首次密码修改',
      });
    }

    const body = await readBody<{ password?: string; confirmPassword?: string }>(event);
    const nextSessionUser = await changeAdminPassword(
      sessionUser.id,
      body.password ?? '',
      body.confirmPassword ?? '',
    );

    await setUserSession(event, {
      user: nextSessionUser satisfies AdminSessionUser,
      loggedInAt: typeof userSession.loggedInAt === 'number' ? userSession.loggedInAt : Date.now(),
    });

    return {
      ok: true,
      user: nextSessionUser,
    };
  },
};

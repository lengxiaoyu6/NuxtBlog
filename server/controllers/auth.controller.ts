import { createError, readBody, type H3Event } from 'h3';
import type { AdminSessionUser } from '../../shared/types/auth';
import { changeAdminPassword, verifyAdminCredentials } from '../services/auth.service';
import { readSiteSecuritySettings } from '../services/site-settings.service';
import { useSecurityRequestService } from '../services/security-request.service';
import { toLoginFailureSettings, toSecurityRateLimitPolicy } from '../services/security-settings.service';

export const authController = {
  async login(event: H3Event) {
    const body = await readBody<{ username?: string; password?: string; turnstileToken?: string }>(event);
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: '用户名和密码不能为空',
      });
    }

    const securitySettings = await readSiteSecuritySettings();
    const securityRequestService = useSecurityRequestService();
    const rateLimitPolicy = toSecurityRateLimitPolicy(securitySettings.login.rateLimit);
    const loginFailureSettings = toLoginFailureSettings(securitySettings.login);

    await securityRequestService.consumeRateLimit(event, {
      action: 'auth_login',
      policy: rateLimitPolicy,
      blockedMessage: '登录请求过于频繁，请稍后再试',
    });
    await securityRequestService.assertLoginAllowed(event, loginFailureSettings);
    await securityRequestService.verifyTurnstile(event, {
      enabled: securitySettings.login.captchaEnabled,
      token: body.turnstileToken,
    });

    const sessionUser = await verifyAdminCredentials(username, password);

    if (!sessionUser) {
      await securityRequestService.registerLoginFailure(event, loginFailureSettings);
      throw createError({
        statusCode: 401,
        statusMessage: '用户名或密码错误',
      });
    }

    await securityRequestService.clearLoginFailures(event);
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

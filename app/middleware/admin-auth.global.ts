import type { AdminSessionUser } from '~~/shared/types/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) {
    return;
  }

  const { loggedIn, ready, fetch, user } = useUserSession();
  const isLoginPage = to.path === '/admin/login';
  const isPasswordSetupPage = to.path === '/admin/password-setup';

  if (!ready.value) {
    await fetch();
  }

  if (!loggedIn.value) {
    if (isLoginPage) {
      return;
    }

    return navigateTo({
      path: '/admin/login',
      query: {
        redirect: to.fullPath,
      },
    });
  }

  const sessionUser = user.value as AdminSessionUser | null | undefined;

  if (sessionUser?.mustChangePassword) {
    if (isPasswordSetupPage) {
      return;
    }

    return navigateTo('/admin/password-setup');
  }

  if (isLoginPage || isPasswordSetupPage) {
    return navigateTo('/admin');
  }
});

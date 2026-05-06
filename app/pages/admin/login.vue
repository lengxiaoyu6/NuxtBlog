<template>
  <AdminAuthShell
    title="管理后台登录"
    icon="i-lucide-layout-dashboard"
    login-only
  >
    <form class="space-y-5" @submit.prevent="handleLogin">
      <UFormField label="用户名" name="username">
        <UInput
          id="username"
          v-model="form.username"
          icon="i-lucide-user-round"
          class="w-full"
          size="xl"
          required
          autocomplete="username"
          placeholder="输入管理员账号"
        />
      </UFormField>

      <UFormField label="密码" name="password">
        <UInput
          id="password"
          v-model="form.password"
          type="password"
          icon="i-lucide-lock"
          class="w-full"
          size="xl"
          required
          autocomplete="current-password"
          placeholder="输入后台登录密码"
        />
      </UFormField>

      <div
        v-if="loginCaptchaEnabled"
        class="rounded-[1.75rem] border border-white/60 bg-white/60 p-4 dark:border-slate-800/70 dark:bg-slate-950/50"
      >
        <div class="mb-3 flex items-start gap-3">
          <UIcon name="i-lucide-shield-check" class="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-300" />
          <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">当前登录通道已启用人机校验。</p>
        </div>
        <TurnstileWidget
          v-model="turnstileToken"
          :enabled="loginCaptchaEnabled"
          :site-key="securityConfig.turnstileSiteKey"
          :reset-nonce="captchaResetNonce"
          @error="loginError = $event"
        />
      </div>

      <div
        v-if="loginError"
        class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
      >
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-alert-circle" class="mt-0.5 size-4 shrink-0" />
          <span>{{ loginError }}</span>
        </div>
      </div>

      <UButton type="submit" size="xl" block :loading="loading">
        <span>{{ loading ? '登录中...' : '立即登录' }}</span>
        <UIcon v-if="!loading" name="i-lucide-arrow-right" class="size-4" />
      </UButton>
    </form>
  </AdminAuthShell>
</template>

<script setup lang="ts">
import type { AdminSessionUser } from '~~/shared/types/auth';
import { isCaptchaRequired } from '~/utils/security-form';
import { resolveRequestErrorMessage } from '~/utils/request-error';

definePageMeta({
  layout: false,
});

const { fetchSiteSettings } = useSiteSettings();
const { securityConfig, fetchSecurityPublicConfig } = useSecurityPublicConfig();

await Promise.all([
  fetchSiteSettings(),
  fetchSecurityPublicConfig(),
]);

useSitePageTitle('后台登录');

const form = reactive({
  username: '',
  password: '',
});

const route = useRoute();
const { user: userSession, fetch: fetchUserSession } = useUserSession();
const loading = ref(false);
const loginError = ref('');
const turnstileToken = ref('');
const captchaResetNonce = ref(0);
const sessionUser = computed(() => userSession.value as AdminSessionUser | null | undefined);
const loginCaptchaEnabled = computed(() => isCaptchaRequired('login', securityConfig.value));

const redirectPath = computed(() => {
  const redirect = route.query.redirect;
  return typeof redirect === 'string' && redirect.startsWith('/admin') ? redirect : '/admin';
});

function resetCaptcha() {
  turnstileToken.value = '';
  captchaResetNonce.value += 1;
}

async function handleLogin() {
  if (loading.value) {
    return;
  }

  loginError.value = '';

  if (loginCaptchaEnabled.value && !turnstileToken.value.trim()) {
    loginError.value = '请先完成人机校验。';
    return;
  }

  loading.value = true;

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: form.username,
        password: form.password,
        turnstileToken: turnstileToken.value || undefined,
      },
    });

    await fetchUserSession();

    if (sessionUser.value?.mustChangePassword) {
      await navigateTo('/admin/password-setup');
      return;
    }

    await navigateTo(redirectPath.value);
  }
  catch (error) {
    loginError.value = resolveRequestErrorMessage(error, '登录失败，请稍后重试。');

    if (loginCaptchaEnabled.value) {
      resetCaptcha();
    }
  }
  finally {
    loading.value = false;
  }
}
</script>

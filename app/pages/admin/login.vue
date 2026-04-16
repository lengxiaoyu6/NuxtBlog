<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <div class="p-3 bg-brand-600 rounded-2xl shadow-xl shadow-brand-500/20">
          <LayoutDashboard class="text-white" :size="32" />
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
        管理后台
      </h2>
      <p class="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        欢迎回来，请登录以继续管理您的博客。
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-slate-900 py-10 px-6 shadow-2xl shadow-slate-200/50 dark:shadow-none sm:rounded-[2.5rem] sm:px-12 border border-slate-100 dark:border-slate-800 relative overflow-hidden paper-texture">
        <form @submit.prevent="handleLogin" class="space-y-6 relative z-10">
          <div>
            <label for="username" class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              用户名
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                <User :size="18" />
              </div>
              <input
                id="username"
                v-model="form.username"
                type="text"
                required
                class="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all text-sm"
                placeholder="您的管理账号"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              密码
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors">
                <Lock :size="18" />
              </div>
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                class="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all text-sm"
                placeholder="请输入密码"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="form.remember"
                type="checkbox"
                class="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-slate-600 dark:text-slate-400">
                记住登录状态
              </label>
            </div>
          </div>

          <div
            v-if="loginCaptchaEnabled"
            class="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40"
          >
            <p class="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">
              当前登录通道已启用人机校验。
            </p>
            <TurnstileWidget
              v-model="turnstileToken"
              :enabled="loginCaptchaEnabled"
              :site-key="securityConfig.turnstileSiteKey"
              :reset-nonce="captchaResetNonce"
              @error="loginError = $event"
            />
          </div>

          <p
            v-if="loginError"
            class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {{ loginError }}
          </p>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              <template v-if="loading">
                <Loader2 class="animate-spin" :size="20" />
                登录中...
              </template>
              <template v-else>
                立即登录
                <ArrowRight :size="18" class="group-hover:translate-x-1 transition-transform" />
              </template>
            </button>
          </div>
        </form>
      </div>

      <div class="mt-8 text-center">
        <NuxtLink to="/" class="text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 transition-colors flex items-center justify-center gap-1">
          <ArrowLeft :size="14" />
          返回博客首页
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LayoutDashboard, User, Lock, ArrowRight, Loader2, ArrowLeft } from 'lucide-vue-next';
import type { AdminSessionUser } from '~~/shared/types/auth';
import { isCaptchaRequired } from '~/utils/security-form';

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
  remember: false,
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

function resolveLoginError(error: unknown) {
  const maybeError = error as {
    data?: {
      statusMessage?: string;
      message?: string;
    };
    statusMessage?: string;
    message?: string;
  };

  return maybeError.data?.statusMessage || maybeError.data?.message || maybeError.statusMessage || maybeError.message || '登录失败，请稍后重试。';
}

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
    loginError.value = resolveLoginError(error);

    if (loginCaptchaEnabled.value) {
      resetCaptcha();
    }
  }
  finally {
    loading.value = false;
  }
}
</script>

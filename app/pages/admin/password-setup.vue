<template>
  <div class="min-h-screen bg-slate-50 px-4 py-12 font-sans dark:bg-slate-950 sm:px-6 lg:px-8">
    <div class="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl items-center">
      <section class="w-full overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div class="border-b border-slate-100 bg-slate-900 px-8 py-8 text-white dark:border-slate-800">
          <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <ShieldAlert :size="28" />
          </div>
          <h1 class="text-2xl font-black tracking-tight">首次登录需要修改密码</h1>
          <p class="mt-3 text-sm leading-6 text-slate-200">
            当前管理员账号仍在使用初始密码 <span class="font-bold text-white">admin123</span>。完成密码更新后，后台页面才会恢复访问。
          </p>
        </div>

        <form class="space-y-6 px-8 py-8" @submit.prevent="handleSubmit">
          <div>
            <label for="password" class="mb-2 block text-sm font-bold text-slate-900 dark:text-white">新密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              class="block h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="请输入至少 8 位的新密码"
              required
            >
          </div>

          <div>
            <label for="confirm-password" class="mb-2 block text-sm font-bold text-slate-900 dark:text-white">确认密码</label>
            <input
              id="confirm-password"
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              class="block h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="请再次输入新密码"
              required
            >
          </div>

          <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            密码长度至少 8 位，且不能继续使用初始密码。
          </div>

          <p
            v-if="feedbackMessage"
            class="rounded-2xl px-4 py-3 text-sm font-medium"
            :class="feedbackTone === 'error'
              ? 'border border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'"
          >
            {{ feedbackMessage }}
          </p>

          <div class="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-brand-600 dark:hover:bg-brand-700"
            >
              <Loader2 v-if="isSubmitting" class="animate-spin" :size="18" />
              <KeyRound v-else :size="18" />
              {{ isSubmitting ? '保存中...' : '更新密码' }}
            </button>

            <button
              type="button"
              :disabled="isLoggingOut"
              class="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              @click="handleLogout"
            >
              <LogOut :size="18" />
              {{ isLoggingOut ? '退出中...' : '退出登录' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KeyRound, Loader2, LogOut, ShieldAlert } from 'lucide-vue-next';

definePageMeta({
  layout: false,
});

const { fetchSiteSettings } = useSiteSettings();

await fetchSiteSettings();

useSitePageTitle('首次修改密码');

const { fetch: fetchUserSession } = useUserSession();
const form = reactive({
  password: '',
  confirmPassword: '',
});
const isSubmitting = ref(false);
const isLoggingOut = ref(false);
const feedbackMessage = ref('');
const feedbackTone = ref<'error' | 'success'>('success');

function resolveRequestError(error: unknown) {
  const requestError = error as {
    data?: {
      statusMessage?: string;
      message?: string;
    };
    statusMessage?: string;
    message?: string;
  };

  return requestError.data?.statusMessage || requestError.data?.message || requestError.statusMessage || requestError.message || '密码修改失败，请稍后重试。';
}

async function handleSubmit() {
  isSubmitting.value = true;
  feedbackMessage.value = '';
  feedbackTone.value = 'success';

  try {
    await $fetch('/api/auth/password/setup', {
      method: 'POST',
      body: {
        password: form.password,
        confirmPassword: form.confirmPassword,
      },
    });

    await fetchUserSession();
    feedbackMessage.value = '密码已更新，正在进入后台首页。';
    await navigateTo('/admin');
  } catch (error) {
    feedbackTone.value = 'error';
    feedbackMessage.value = resolveRequestError(error);
  } finally {
    isSubmitting.value = false;
  }
}

async function handleLogout() {
  if (isLoggingOut.value) {
    return;
  }

  isLoggingOut.value = true;

  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
    });
    await fetchUserSession();
    await navigateTo('/admin/login');
  } finally {
    isLoggingOut.value = false;
  }
}
</script>

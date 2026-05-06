<template>
  <AdminAuthShell
    title="首次登录需要修改密码"
    icon="i-lucide-shield-check"
    login-only
  >
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <UFormField label="新密码" help="密码长度至少 8 位，且不能继续使用初始密码。">
        <UInput
          id="password"
          v-model="form.password"
          type="password"
          icon="i-lucide-key-round"
          size="xl"
          required
          autocomplete="new-password"
          placeholder="请输入至少 8 位的新密码"
        />
      </UFormField>

      <UFormField label="确认密码">
        <UInput
          id="confirm-password"
          v-model="form.confirmPassword"
          type="password"
          icon="i-lucide-lock-keyhole"
          size="xl"
          required
          autocomplete="new-password"
          placeholder="请再次输入新密码"
        />
      </UFormField>

      <div class="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" />
          <span>更新成功后会立即刷新管理员会话状态，并跳转至后台首页。</span>
        </div>
      </div>

      <div
        v-if="feedbackMessage"
        class="rounded-[1.5rem] border px-4 py-3 text-sm"
        :class="feedbackTone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200'"
      >
        <div class="flex items-start gap-3">
          <UIcon :name="feedbackTone === 'error' ? 'i-lucide-alert-circle' : 'i-lucide-shield-check'" class="mt-0.5 size-4 shrink-0" />
          <span>{{ feedbackMessage }}</span>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <UButton type="submit" size="xl" :loading="isSubmitting" block>
          <span>{{ isSubmitting ? '保存中...' : '更新密码' }}</span>
          <UIcon v-if="!isSubmitting" name="i-lucide-key-round" class="size-4" />
        </UButton>

        <UButton
          type="button"
          size="xl"
          block
          color="neutral"
          variant="soft"
          :loading="isLoggingOut"
          icon="i-lucide-log-out"
          @click="handleLogout"
        >
          {{ isLoggingOut ? '退出中...' : '退出登录' }}
        </UButton>
      </div>
    </form>
  </AdminAuthShell>
</template>

<script setup lang="ts">
import { resolveRequestErrorMessage } from '~/utils/request-error';

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
    feedbackMessage.value = resolveRequestErrorMessage(error, '密码修改失败，请稍后重试。');
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

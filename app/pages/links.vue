<template>
  <main class="flex-grow pt-32 pb-20">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-2 hidden lg:block">
          <LeftSidebar />
        </div>

        <div class="lg:col-span-8 space-y-12">
          <header class="mb-16">
            <div class="relative inline-block">
              <h1 class="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white mb-4 font-serif tracking-tighter">Friends<span class="text-brand-600">.</span></h1>
              <div class="absolute -bottom-2 left-0 w-24 h-2 bg-brand-600 rounded-full" />
            </div>
            <p class="mt-8 text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-sans">
              志同道合，并肩前行。这里收录一些优秀的小伙伴与值得关注的技术站点。
            </p>
          </header>

          <div class="space-y-3">
            <h2 class="text-sm font-black uppercase tracking-[0.28em] text-slate-400">{{ page.friendsSection.title }}</h2>
            <div class="h-px bg-slate-100 dark:bg-slate-800" />
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
            <a
              v-for="friend in visibleFriends"
              :key="friend.id"
              :href="friend.url"
              @click="(e) => handleFriendClick(e, friend)"
              target="_blank"
              rel="noopener noreferrer"
              class="group relative p-3 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-900/50 transition-all hover:shadow-2xl hover:shadow-slate-200/20 dark:hover:shadow-none"
            >
              <div class="flex items-center sm:items-start gap-3 sm:gap-4">
                <div
                  class="w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shrink-0 group-hover:scale-110 transition-transform duration-500"
                >
                  <img
                    :src="friend.avatarUrl"
                    :alt="friend.name"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer"
                    @error="onAvatarError($event, friend.name)"
                  />
                </div>
                <div class="flex-grow min-w-0">
                  <h3 class="text-xs sm:text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 transition-colors truncate font-serif">
                    {{ friend.name }}
                  </h3>
                  <p class="hidden sm:line-clamp-2 text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {{ friend.description }}
                  </p>
                </div>
                <div class="hidden sm:block text-slate-300 group-hover:text-brand-600 transition-colors">
                  <ExternalLink :size="16" />
                </div>
              </div>
            </a>
          </div>

          <div class="mt-16 space-y-12">
            <section
              class="p-6 sm:p-10 bg-slate-900 dark:bg-brand-950 rounded-[2.5rem] text-white relative overflow-hidden"
            >
              <div class="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 blur-[100px] rounded-full -mr-32 -mt-32" />
              <div class="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -ml-32 -mb-32" />

              <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div class="space-y-8">
                  <button
                    @click="scrollToForm"
                    class="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-brand-600 text-white text-sm font-bold uppercase tracking-widest hover:bg-brand-700 hover:scale-105 transition-all shadow-lg shadow-brand-500/20"
                  >
                    <Plus :size="18" />
                    {{ LINKS_PAGE_COPY.applyBadgeText }}
                  </button>
                  <h2 class="text-4xl sm:text-5xl font-black font-serif leading-tight">
                    {{ LINKS_PAGE_COPY.applyTitle }}
                  </h2>
                  <p class="text-slate-400 text-base leading-relaxed max-w-md">
                    {{ LINKS_PAGE_COPY.applyDescription }}
                  </p>
                </div>

                <div class="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/10 space-y-5">
                  <div class="space-y-4">
                    <div class="flex items-center gap-4">
                          <div class="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
                            <Info :size="20" />
                          </div>
                          <h4 class="text-lg font-black font-serif tracking-tight">{{ LINKS_PAGE_COPY.ownerTitle }}</h4>
                        </div>

                    <div class="space-y-1">
                      <div
                        v-for="info in myInfo"
                        :key="info.label"
                        class="group/item flex items-center justify-between gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                      >
                        <div class="text-[11px] sm:text-xs text-slate-400 font-mono flex-grow min-w-0 break-all leading-snug">
                          <span class="text-slate-500">{{ info.label }}：</span>{{ info.value }}
                        </div>
                        <button
                          @click="copyToClipboard(info.value, info.label)"
                          class="p-2 rounded-xl bg-white/5 hover:bg-brand-600 hover:text-white text-slate-400 transition-all shrink-0 ml-1 shadow-sm"
                          :title="`复制${info.label}`"
                        >
                          <Check v-if="copiedLabel === info.label" :size="14" />
                          <Copy v-else :size="14" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="h-px bg-white/10" />
                  <div class="flex items-center gap-3 text-xs text-slate-400">
                    <MessageSquare :size="16" class="text-brand-500" />
                    <span>{{ LINKS_PAGE_COPY.ownerTip }}</span>
                  </div>
                </div>
              </div>
            </section>

            <div
              id="apply-form"
              class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 dark:border-slate-800 shadow-sm paper-texture scroll-mt-32"
            >
              <div class="mb-10">
                <h3 class="text-2xl font-black text-slate-900 dark:text-white font-serif mb-2">{{ LINKS_PAGE_COPY.applyBadgeText }}</h3>
                <p class="text-slate-500 dark:text-slate-400 text-sm">{{ LINKS_PAGE_COPY.formDescription }}</p>
              </div>

              <form @submit.prevent="handleSubmit" class="space-y-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{{ LINKS_PAGE_COPY.siteNameLabel }}</label>
                    <div class="relative">
                      <User class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                      <input
                        v-model="formData.name"
                        type="text"
                        required
                        :placeholder="LINKS_PAGE_COPY.siteNamePlaceholder"
                        class="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-brand-600 transition-colors text-sm dark:text-white"
                      />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{{ LINKS_PAGE_COPY.siteUrlLabel }}</label>
                    <div class="relative">
                      <Globe class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                      <input
                        v-model="formData.url"
                        type="url"
                        required
                        :placeholder="LINKS_PAGE_COPY.siteUrlPlaceholder"
                        class="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-brand-600 transition-colors text-sm dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{{ LINKS_PAGE_COPY.avatarLabel }}</label>
                    <div class="relative">
                      <ImageIcon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                      <input
                        v-model="formData.avatarUrl"
                        type="url"
                        required
                        :placeholder="LINKS_PAGE_COPY.avatarPlaceholder"
                        class="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-brand-600 transition-colors text-sm dark:text-white"
                      />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                      {{ LINKS_PAGE_COPY.contactLabel }}
                    </label>
                    <div class="relative">
                      <MessageSquare class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                      <input
                        v-model="formData.contact"
                        type="text"
                        required
                        :placeholder="LINKS_PAGE_COPY.contactPlaceholder"
                        class="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-brand-600 transition-colors text-sm dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{{ LINKS_PAGE_COPY.descriptionLabel }}</label>
                  <div class="relative">
                    <FileText class="absolute left-4 top-5 text-slate-400" :size="18" />
                    <textarea
                      v-model="formData.description"
                      required
                      rows="3"
                      :placeholder="LINKS_PAGE_COPY.descriptionPlaceholder"
                      class="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl outline-none focus:border-brand-600 transition-colors text-sm dark:text-white resize-none"
                    />
                  </div>
                </div>

                <TurnstileWidget
                  v-model="turnstileToken"
                  :enabled="captchaEnabled"
                  :site-key="securityConfig.turnstileSiteKey"
                  :reset-nonce="captchaResetNonce"
                  @error="handleCaptchaError"
                />

                <div class="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2 text-xs text-slate-400">
                      <Info :size="14" />
                      <span>{{ LINKS_PAGE_COPY.submitHint }}</span>
                    </div>
                    <p
                      v-if="submissionMessage"
                      class="text-sm"
                      :class="submissionTone === 'error' ? 'text-rose-500 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'"
                    >
                      {{ submissionMessage }}
                    </p>
                  </div>

                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    :class="
                      isSuccess
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                        : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
                    "
                    class="relative flex items-center gap-2 px-12 py-4 font-bold rounded-2xl shadow-xl transition-all active:scale-95 group overflow-hidden disabled:opacity-80"
                  >
                    <template v-if="isSubmitting">
                      <Plus :size="20" class="rotate-45 animate-spin" />
                      {{ LINKS_PAGE_COPY.submittingText }}
                    </template>
                    <template v-else-if="isSuccess">
                      <CheckCircle2 :size="20" />
                      {{ LINKS_PAGE_COPY.successText }}
                    </template>
                    <template v-else>
                      {{ LINKS_PAGE_COPY.submitText }}
                      <Send :size="18" class="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </template>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 hidden lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <UModal v-model:open="isConfirmModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2">
                <ExternalLink class="text-brand-500" :size="20" />
                即将离开本站
              </h3>
              <UButton color="neutral" variant="ghost" icon="lucide:x" class="-my-1" @click="isConfirmModalOpen = false" />
            </div>
          </template>

          <div class="py-4 space-y-4">
            <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              您即将前往 <strong class="text-slate-900 dark:text-slate-200">{{ selectedFriend?.name }}</strong> 的站点，该网站不属于本站管理，请注意保护个人信息安全。
            </p>
            <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-400 font-mono break-all border border-slate-100 dark:border-slate-800">
              {{ selectedFriend?.url }}
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="outline" @click="isConfirmModalOpen = false" class="rounded-xl px-5">
                取消
              </UButton>
              <UButton color="primary" @click="confirmNavigate" class="rounded-xl px-5">
                继续访问
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </main>
</template>

<script setup lang="ts">
import {
  ExternalLink,
  Plus,
  MessageSquare,
  Info,
  Send,
  Globe,
  Image as ImageIcon,
  FileText,
  User,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-vue-next';
import { isCaptchaRequired } from '~/utils/security-form';
import { resolveRequestErrorMessage } from '~/utils/request-error';

const isSubmitting = ref(false);
const isSuccess = ref(false);
const copiedLabel = ref('');
const submissionMessage = ref('');
const submissionTone = ref<'success' | 'error'>('success');
const turnstileToken = ref('');
const captchaResetNonce = ref(0);
const toast = useToast();
const { settings } = useSiteSettings();
const { pageSettings } = usePageSettings();
const { securityConfig, fetchSecurityPublicConfig } = useSecurityPublicConfig();

const LINKS_PAGE_COPY = {
  applyBadgeText: '申请友链',
  applyTitle: '想要出现在这里？欢迎交换友链。',
  applyDescription: '欢迎高质量技术博客、设计站点或个人主页进行链接交换，站点内容需保持正常更新。',
  ownerTitle: '我的信息',
  ownerTip: '请在下方填写站点信息进行申请',
  formDescription: '填写以下表单，提交后会尽快审核并添加。',
  siteNameLabel: '站点名称',
  siteNamePlaceholder: '例如：TechFlow.blog',
  siteUrlLabel: '站点链接',
  siteUrlPlaceholder: 'https://example.com',
  avatarLabel: '头像链接',
  avatarPlaceholder: 'https://example.com/avatar.png',
  contactLabel: '联系方式',
  contactPlaceholder: '邮箱或即时通信账号',
  descriptionLabel: '站点描述',
  descriptionPlaceholder: '简单介绍站点定位...',
  submitHint: '提交后通常会在 24 小时内处理。',
  submitText: '确认提交',
  submittingText: '提交中...',
  successText: '提交成功',
} as const;

const { fetchPageSettings } = usePageSettings();
const { fetchSiteSettings } = useSiteSettings();

await Promise.all([
  fetchPageSettings(),
  fetchSiteSettings(),
  fetchSecurityPublicConfig(),
]);

if (!pageSettings.value.links.enabled) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const page = computed(() => pageSettings.value.links);
const captchaEnabled = computed(() => isCaptchaRequired('linkApplication', securityConfig.value));

useSitePageTitle(() => page.value.seo.title || '友情链接');

useSeoMeta({
  description: () => page.value.seo.description || settings.value.site.description,
});

const isConfirmModalOpen = ref(false);
const selectedFriend = ref<{ name: string; url: string } | null>(null);

const formData = ref({

  name: '',
  url: '',
  description: '',
  avatarUrl: '',
  contact: '',
});

const visibleFriends = computed(() =>
  page.value.friends.filter((item) => item.status === 'visible' && item.url.trim())
);

const myInfo = computed(() => [
  { label: '名称', value: page.value.friendCard.name },
  { label: '简介', value: page.value.friendCard.description },
  { label: '链接', value: page.value.friendCard.url },
  { label: '头像', value: page.value.friendCard.avatarUrl },
]);

function handleFriendClick(event: Event, friend: { name: string; url: string }) {
  event.preventDefault();
  
  if (import.meta.client) {
    selectedFriend.value = friend;
    isConfirmModalOpen.value = true;
  }
}

function confirmNavigate() {
  if (selectedFriend.value?.url) {
    window.open(selectedFriend.value.url, '_blank', 'noopener,noreferrer');
    isConfirmModalOpen.value = false;
  }
}

function onAvatarError(event: Event, name: string) {
  const target = event.target as HTMLImageElement;
  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
}

function copyToClipboard(text: string, label: string) {
  if (import.meta.client) {
    navigator.clipboard.writeText(text);
    copiedLabel.value = label;
    toast.add({
      title: `${label}已复制到剪贴板`,
      color: 'success',
      duration: 2000
    });
    window.setTimeout(() => {
      copiedLabel.value = '';
    }, 2000);
  }
}

function scrollToForm() {
  const form = document.getElementById('apply-form');
  if (form) {
    form.scrollIntoView({ behavior: 'smooth' });
  }
}

function resetCaptcha() {
  turnstileToken.value = '';
  captchaResetNonce.value += 1;
}

function ensureCaptchaReady() {
  if (!captchaEnabled.value || turnstileToken.value.trim()) {
    return true;
  }

  submissionTone.value = 'error';
  submissionMessage.value = '请先完成人机校验。';
  toast.add({
    title: '请先完成人机校验。',
    color: 'warning',
    duration: 2500,
  });
  return false;
}

function handleCaptchaError(message: string) {
  submissionTone.value = 'error';
  submissionMessage.value = message;
}

async function handleSubmit() {
  submissionMessage.value = '';
  submissionTone.value = 'success';
  isSuccess.value = false;

  if (!ensureCaptchaReady()) {
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await $fetch<{ ok: true; message: string }>('/api/links/applications', {
      method: 'POST',
      body: {
        name: formData.value.name.trim(),
        url: formData.value.url.trim(),
        avatarUrl: formData.value.avatarUrl.trim(),
        contact: formData.value.contact.trim(),
        description: formData.value.description.trim(),
        turnstileToken: captchaEnabled.value ? turnstileToken.value || undefined : undefined,
      },
    });

    submissionTone.value = 'success';
    submissionMessage.value = response.message;
    isSuccess.value = true;
    toast.add({
      title: response.message,
      color: 'success',
      duration: 2500,
    });
    formData.value = {
      name: '',
      url: '',
      description: '',
      avatarUrl: '',
      contact: '',
    };
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '友链申请提交失败');
    submissionTone.value = 'error';
    submissionMessage.value = message;
    toast.add({
      title: message,
      color: 'error',
      duration: 3000,
    });
  }
  finally {
    isSubmitting.value = false;

    if (captchaEnabled.value) {
      resetCaptcha();
    }
  }
}
</script>

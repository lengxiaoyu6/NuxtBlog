<template>
  <section class="mt-16 space-y-12">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <MessageCircle class="text-brand-600 shrink-0" :size="20" />
        <h2 class="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-serif truncate whitespace-nowrap">
          评论交流 <span class="text-slate-300 dark:text-slate-700 ml-1 sm:ml-2">({{ visibleComments.length }})</span>
        </h2>
      </div>

      <button
        type="button"
        @click="isFormOpen = true"
        class="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-900 dark:bg-brand-600 text-white text-xs sm:text-sm font-bold rounded-full shadow-lg transition-all hover:scale-105 shrink-0 whitespace-nowrap"
      >
        <Plus :size="16" />
        发表评论
      </button>
    </div>

    <div
      v-if="captchaEnabled"
      :class="isFormOpen
        ? 'fixed inset-x-4 bottom-4 z-[80] mx-auto w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95'
        : 'rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40'"
    >
      <p class="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">
        {{ captchaHint }}
      </p>
      <TurnstileWidget
        v-model="turnstileToken"
        :enabled="captchaEnabled"
        :site-key="securityConfig.turnstileSiteKey"
        :reset-nonce="captchaResetNonce"
        @error="handleCaptchaError"
      />
    </div>

    <div v-if="isFormOpen" class="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm" @click="isFormOpen = false" />

    <div v-if="isFormOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
      <div
        class="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-slate-100 dark:border-slate-800 paper-texture pointer-events-auto relative overflow-hidden"
      >
        <button
          type="button"
          @click="isFormOpen = false"
          class="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          aria-label="关闭评论弹窗"
        >
          <X :size="24" />
        </button>

        <div class="mb-8">
          <h3 class="text-2xl font-black text-slate-900 dark:text-white font-serif mb-2">发表新评论</h3>
          <p class="text-slate-500 dark:text-slate-400 text-sm">分享见解，与大家一起讨论。</p>
          <p
            v-if="submissionMessage"
            class="mt-3 text-sm font-medium"
            :class="submissionTone === 'success' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'"
          >
            {{ submissionMessage }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="relative">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
              <input
                v-model="name"
                type="text"
                placeholder="昵称"
                class="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-brand-600 transition-colors text-sm dark:text-white"
                required
              />
            </div>
            <input
              v-model="email"
              type="email"
              placeholder="电子邮箱"
              class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-brand-600 transition-colors text-sm dark:text-white"
              required
            />
          </div>

          <textarea
            v-model="newComment"
            placeholder="分享看法..."
            rows="5"
            class="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl outline-none focus:border-brand-600 transition-colors text-sm dark:text-white resize-none"
            required
          />

          <div v-if="captchaEnabled" class="rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-xs text-brand-700 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-200">
            当前页面已启用人机校验，请先完成上方校验后再提交。
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              class="flex items-center gap-2 px-10 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 transition-all active:scale-95 group"
            >
              确认发布
              <Send :size="20" class="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="space-y-4">
      <CommentItem
        v-for="comment in visibleComments"
        :key="comment.id"
        :comment="comment"
        @reply="handleAddReply"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Send, User, MessageCircle, X, Plus } from 'lucide-vue-next';
import type { CommentItemData } from '~/types/comment';
import type { PublicPostCommentItem } from '~/types/post-comment';
import { useAppToast } from '~/composables/useAppToast';
import { isCaptchaRequired } from '~/utils/security-form';
import { resolveRequestErrorMessage } from '~/utils/request-error';

interface CommentSubmitPayload {
  parentId?: string;
  authorName: string;
  authorEmail: string;
  content: string;
  turnstileToken?: string;
}

interface CommentSubmitResponse {
  ok: boolean;
  message: string;
}

const props = withDefaults(
  defineProps<{
    pageId?: string;
  }>(),
  {
    pageId: 'default',
  },
);

const comments = ref<CommentItemData[]>([]);
const newComment = ref('');
const name = ref('');
const email = ref('');
const isFormOpen = ref(false);
const submissionMessage = ref('');
const submissionTone = ref<'success' | 'error'>('success');
const turnstileToken = ref('');
const captchaResetNonce = ref(0);
const isGuestbookPage = computed(() => props.pageId === 'guestbook');
const visibleComments = computed(() => comments.value);
const commentsEndpoint = computed(() => `/api/posts/${props.pageId}/comments`);
const captchaScene = computed(() => (isGuestbookPage.value ? 'guestbook' : 'comment'));
const captchaHint = computed(() => (isGuestbookPage.value
  ? '留言或回复前，请先完成人机校验。'
  : '发表评论或回复前，请先完成人机校验。'));
const { addToast } = useAppToast();
const { securityConfig, fetchSecurityPublicConfig } = useSecurityPublicConfig();

await fetchSecurityPublicConfig();

const captchaEnabled = computed(() => isCaptchaRequired(captchaScene.value, securityConfig.value));

function resetSubmissionFeedback() {
  submissionMessage.value = '';
  submissionTone.value = 'success';
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
  addToast('请先完成人机校验。', 'warning');
  return false;
}

function handleCaptchaError(message: string) {
  submissionTone.value = 'error';
  submissionMessage.value = message;
}

function resetForm() {
  newComment.value = '';
  name.value = '';
  email.value = '';
  isFormOpen.value = false;
}

function buildSubmitPayload(payload: CommentSubmitPayload): CommentSubmitPayload {
  return {
    ...payload,
    turnstileToken: captchaEnabled.value ? turnstileToken.value || undefined : undefined,
  };
}

function toCommentItem(item: PublicPostCommentItem): CommentItemData {
  return {
    id: item.id,
    author: item.authorName,
    avatar: item.authorAvatarUrl,
    date: item.submittedAt.slice(0, 10),
    submittedAt: item.submittedAt,
    region: item.authorRegion,
    content: item.content,
    likes: 0,
    replies: item.replies.map(toCommentItem),
  };
}

async function readComments() {
  if (isGuestbookPage.value) {
    comments.value = await $fetch<CommentItemData[]>('/api/guestbook/entries').catch(() => []);
    return;
  }

  comments.value = await $fetch<PublicPostCommentItem[]>(commentsEndpoint.value)
    .then((items) => items.map(toCommentItem))
    .catch(() => []);
}

async function handleSubmit() {
  if (!newComment.value.trim() || !name.value.trim()) {
    return;
  }

  if (!ensureCaptchaReady()) {
    return;
  }

  if (isGuestbookPage.value) {
    try {
      await $fetch('/api/guestbook/entries', {
        method: 'POST',
        body: buildSubmitPayload({
          authorName: name.value.trim(),
          authorEmail: email.value.trim(),
          content: newComment.value.trim(),
        }),
      });
      submissionTone.value = 'success';
      submissionMessage.value = '留言已提交，等待审核后展示。';
      addToast('留言已提交，等待审核后展示。', 'success');
      resetForm();
    }
    catch (error) {
      const message = resolveRequestErrorMessage(error, '留言提交失败');
      submissionTone.value = 'error';
      submissionMessage.value = message;
      addToast(message, 'error');
    }
    finally {
      if (captchaEnabled.value) {
        resetCaptcha();
      }
    }

    return;
  }

  try {
    const response = await $fetch<CommentSubmitResponse>(commentsEndpoint.value, {
      method: 'POST',
      body: buildSubmitPayload({
        authorName: name.value.trim(),
        authorEmail: email.value.trim(),
        content: newComment.value.trim(),
      }),
    });
    submissionTone.value = 'success';
    submissionMessage.value = response.message;
    addToast(response.message, 'success');
    resetForm();
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '评论提交失败');
    submissionTone.value = 'error';
    submissionMessage.value = message;
    addToast(message, 'error');
  }
  finally {
    if (captchaEnabled.value) {
      resetCaptcha();
    }
  }
}

async function handleAddReply(payload: { parentId: string; author: string; authorEmail: string; content: string }) {
  if (!ensureCaptchaReady()) {
    return;
  }

  if (isGuestbookPage.value) {
    try {
      await $fetch('/api/guestbook/entries', {
        method: 'POST',
        body: buildSubmitPayload({
          parentId: payload.parentId,
          authorName: payload.author,
          authorEmail: payload.authorEmail,
          content: payload.content,
        }),
      });
      submissionTone.value = 'success';
      submissionMessage.value = '回复已提交，等待审核后展示。';
      addToast('回复已提交，等待审核后展示。', 'success');
    }
    catch (error) {
      const message = resolveRequestErrorMessage(error, '回复提交失败');
      submissionTone.value = 'error';
      submissionMessage.value = message;
      addToast(message, 'error');
    }
    finally {
      if (captchaEnabled.value) {
        resetCaptcha();
      }
    }

    return;
  }

  try {
    const response = await $fetch<CommentSubmitResponse>(commentsEndpoint.value, {
      method: 'POST',
      body: buildSubmitPayload({
        parentId: payload.parentId,
        authorName: payload.author,
        authorEmail: payload.authorEmail,
        content: payload.content,
      }),
    });
    submissionTone.value = 'success';
    submissionMessage.value = response.message;
    addToast(response.message, 'success');
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '回复提交失败');
    submissionTone.value = 'error';
    submissionMessage.value = message;
    addToast(message, 'error');
  }
  finally {
    if (captchaEnabled.value) {
      resetCaptcha();
    }
  }
}

onMounted(() => {
  resetSubmissionFeedback();
  void readComments();
});

watch(() => props.pageId, () => {
  resetSubmissionFeedback();
  resetCaptcha();
  void readComments();
});
</script>

<template>
  <div :class="['group', isReply ? 'ml-4 mt-4' : 'mt-8']">
    <div class="flex gap-4">
      <img
        :src="comment.avatar"
        :alt="comment.author"
        :class="[
          isReply ? 'w-8 h-8' : 'w-12 h-12',
          'rounded-full border-2 border-white dark:border-slate-800 shadow-sm shrink-0',
        ]"
        referrerpolicy="no-referrer"
      />
      <div class="flex-grow min-w-0 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-bold text-slate-900 dark:text-white text-sm font-serif truncate">{{ comment.author }}</span>
            <span class="text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap">{{ comment.date }}</span>
            <span v-if="comment.region" class="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
              IP: {{ comment.region }}
            </span>
          </div>
          <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              @click="isReplying = !isReplying"
              :class="isReplying ? 'text-brand-600' : 'text-slate-400 hover:text-brand-600'"
              aria-label="回复评论"
            >
              <Reply :size="14" />
            </button>
            <button
              type="button"
              @click="toggleLike"
              :class="isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'"
              class="flex items-center gap-1 transition-colors"
              aria-label="点赞评论"
            >
              <Heart :size="14" :class="isLiked ? 'fill-current' : ''" />
              <span class="text-[10px] font-bold">{{ likesCount }}</span>
            </button>
          </div>
        </div>

        <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          <template v-if="comment.content.startsWith('@')">
            <span class="text-brand-600 font-bold mr-1">{{ comment.content.split(' ')[0] }}</span>
            {{ comment.content.split(' ').slice(1).join(' ') }}
          </template>
          <template v-else>{{ comment.content }}</template>
        </p>

        <form v-if="isReplying" @submit.prevent="submitReply" class="overflow-hidden pt-4 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="relative">
              <User :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="replyName"
                type="text"
                placeholder="昵称"
                class="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-brand-600 text-xs dark:text-white"
                required
              />
            </div>
            <input
              v-model="replyEmail"
              type="email"
              placeholder="电子邮箱"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-brand-600 text-xs dark:text-white"
              required
            />
          </div>
          <div class="flex gap-2">
            <input
              v-model="replyText"
              type="text"
              :placeholder="`回复 ${comment.author}...`"
              class="flex-grow px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-brand-600 text-xs dark:text-white"
              required
            />
            <button type="submit" class="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors">
              发送
            </button>
            <button type="button" @click="isReplying = false" class="px-3 py-2 text-slate-400 hover:text-slate-600 text-xs font-bold">
              取消
            </button>
          </div>
        </form>

        <div
          v-if="comment.replies && comment.replies.length > 0"
          class="border-l-2 border-slate-100 dark:border-slate-800 mt-4"
        >
          <CommentItem
            v-for="reply in comment.replies"
            :key="reply.id"
            :comment="reply"
            :is-reply="true"
            @reply="forwardReply"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Reply, Heart, User } from 'lucide-vue-next';
import type { CommentItemData } from '~/types/comment';

const props = withDefaults(
  defineProps<{
    comment: CommentItemData;
    isReply?: boolean;
  }>(),
  { isReply: false },
);

const emit = defineEmits<{
  (
    event: 'reply',
    payload: { parentId: string; author: string; authorEmail: string; content: string },
  ): void;
}>();

const isReplying = ref(false);
const replyText = ref('');
const replyName = ref('');
const replyEmail = ref('');
const isLiked = ref(false);
const likesCount = ref(props.comment.likes);

function submitReply() {
  if (!replyText.value.trim() || !replyName.value.trim() || !replyEmail.value.trim()) {
    return;
  }

  emit('reply', {
    parentId: props.comment.id,
    author: replyName.value.trim(),
    authorEmail: replyEmail.value.trim(),
    content: `@${props.comment.author} ${replyText.value.trim()}`,
  });

  replyText.value = '';
  replyName.value = '';
  replyEmail.value = '';
  isReplying.value = false;
}

function toggleLike() {
  if (isLiked.value) {
    likesCount.value -= 1;
  } else {
    likesCount.value += 1;
  }
  isLiked.value = !isLiked.value;
}

function forwardReply(payload: { parentId: string; author: string; authorEmail: string; content: string }) {
  emit('reply', payload);
}
</script>

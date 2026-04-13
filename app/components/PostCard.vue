<template>
  <article
    :class="[
      'group relative bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 card-hover paper-texture overflow-hidden',
      post.isPinned ? 'border-l-4 border-l-brand-600' : '',
    ]"
  >
    <div
      v-if="post.isPinned"
      class="absolute top-3 right-4 flex items-center gap-1.5 text-[9px] font-black text-brand-600 uppercase tracking-[0.2em] font-serif z-10"
    >
      <Pin :size="8" :stroke-width="3" />
      Featured
    </div>

    <div class="flex flex-col sm:flex-row gap-6">
      <NuxtLink
        v-if="post.coverImageUrl"
        :to="`/post/${post.identifier}`"
        class="relative w-full sm:w-48 h-32 shrink-0 overflow-hidden rounded-lg"
      >
        <img
          :src="post.coverImageUrl"
          :alt="post.title"
          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerpolicy="no-referrer"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </NuxtLink>

      <div class="flex flex-col flex-grow min-w-0 py-1">
        <div
          class="flex items-center gap-3 text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 font-serif"
        >
          <span class="text-brand-600 font-bold tracking-wider">{{ post.category }}</span>
          <span class="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div class="flex items-center gap-1">
            <Calendar :size="10" />
            {{ post.publishedAt }}
          </div>
          <template v-if="post.likesCount !== undefined">
            <span class="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div class="flex items-center gap-1 text-red-400 font-bold">
              <Heart :size="10" class="fill-current" />
              {{ post.likesCount }}
            </div>
          </template>
        </div>

        <NuxtLink :to="`/post/${post.identifier}`">
          <h3
            class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 transition-colors leading-tight font-serif truncate sm:whitespace-normal"
          >
            {{ post.title }}
          </h3>
        </NuxtLink>

        <p class="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2 font-sans">
          {{ post.excerpt }}
        </p>

        <div class="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
          <div class="flex gap-1.5">
            <span
              v-for="tag in post.tags.slice(0, 2)"
              :key="tag"
              class="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded"
            >
              #{{ tag }}
            </span>
          </div>
          <NuxtLink
            :to="`/post/${post.identifier}`"
            class="text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center gap-1 group/btn"
          >
            Read
            <ArrowRight :size="14" class="transition-transform group-hover/btn:translate-x-1" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Calendar, ArrowRight, Pin, Heart } from 'lucide-vue-next';
import type { PublicPostListItem } from '~/types/post';

defineProps<{
  post: PublicPostListItem;
  index: number;
}>();
</script>

<template>
  <main class="flex-grow pt-32 pb-20">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-2 hidden lg:block">
          <LeftSidebar />
        </div>

        <article v-if="post" class="lg:col-span-8 space-y-8">
          <div
            class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm paper-texture overflow-hidden"
          >
            <div v-if="post.coverImageUrl" class="relative h-64 sm:h-96 w-full overflow-hidden">
              <img
                :src="post.coverImageUrl"
                :alt="post.title"
                class="w-full h-full object-cover"
                referrerpolicy="no-referrer"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent" />
            </div>

            <div class="p-6 sm:p-12 -mt-20 relative z-10">
              <NuxtLink
                to="/"
                class="inline-flex items-center gap-2 text-sm font-bold text-brand-600 mb-8 hover:gap-3 transition-all group"
              >
                <ArrowLeft :size="16" />
                返回列表
              </NuxtLink>

              <div class="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-400 mb-6 font-serif">
                <span class="text-brand-600 font-bold">{{ post.category }}</span>
                <span class="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div class="flex items-center gap-1.5">
                  <Calendar :size="14" />
                  {{ post.publishedAt }}
                </div>
                <span class="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div class="flex items-center gap-1.5">
                  <Clock :size="14" />
                  {{ post.readTimeText }}
                </div>
                <span class="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div class="flex items-center gap-1.5">
                  <Eye :size="14" />
                  {{ views }}
                </div>
              </div>

              <h1 class="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-8 leading-tight font-serif">
                {{ post.title }}
              </h1>

              <div class="flex flex-wrap gap-3 mb-12">
                <span
                  v-for="tag in post.tags"
                  :key="tag"
                  class="flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-full border border-slate-100 dark:border-slate-800"
                >
                  <Tag :size="12" />
                  {{ tag }}
                </span>
              </div>

              <div class="prose prose-slate dark:prose-invert max-w-none markdown-body content-table-grid" v-html="renderedContent" />

              <div class="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
                <div class="flex items-center gap-8">
                  <button
                    type="button"
                    @click="toggleLike"
                    :disabled="isLiked || submittingLike"
                    :class="isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'"
                    class="flex items-center gap-2 text-sm font-bold transition-all"
                  >
                    <Heart :size="20" :class="isLiked ? 'fill-current' : ''" />
                    点赞 ({{ likes }})
                  </button>
                  <button
                    type="button"
                    @click="shareArticle"
                    class="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-brand-600 transition-colors"
                  >
                    <Share2 :size="18" />
                    分享文章
                  </button>
                </div>
              </div>

              <div class="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-12">
                <NuxtLink
                  v-if="prevPost"
                  :to="`/post/${prevPost.identifier}`"
                  class="group p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-900/50 transition-all text-left"
                >
                  <div class="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    <ChevronLeft :size="14" />
                    上一篇
                  </div>
                  <div class="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {{ prevPost.title }}
                  </div>
                </NuxtLink>
                <div
                  v-else
                  class="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 dark:text-slate-700 uppercase tracking-wider"
                >
                  已经是第一篇了
                </div>

                <NuxtLink
                  v-if="nextPost"
                  :to="`/post/${nextPost.identifier}`"
                  class="group p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-900/50 transition-all text-right"
                >
                  <div class="flex items-center justify-end gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    下一篇
                    <ChevronRight :size="14" />
                  </div>
                  <div class="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {{ nextPost.title }}
                  </div>
                </NuxtLink>
                <div
                  v-else
                  class="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 dark:text-slate-700 uppercase tracking-wider"
                >
                  已经是最后一篇了
                </div>
              </div>

              <CommentSection :page-id="identifier" />
            </div>
          </div>
        </article>

        <div v-else class="lg:col-span-8 min-h-[60vh] flex items-center justify-center">
          <div class="text-center space-y-4">
            <h1 class="text-4xl font-bold text-slate-900 dark:text-white">文章未找到</h1>
            <NuxtLink to="/" class="text-brand-600 hover:underline">返回首页</NuxtLink>
          </div>
        </div>

        <div class="lg:col-span-2 hidden lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Tag,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next';
import type { PublicPostDetail, PublicPostDetailResponse, PublicPostInteractionResponse } from '~/types/post';
import {
  hasLikedPost,
  mergeLikedPostIds,
  postLikedIdsCookieKey,
  postLikedIdsStorageKey,
  postViewedAtStorageKey,
  readPostViewedAtMap,
  rememberLikedPost,
  rememberPostView,
  shouldCountPostView,
} from '~/utils/post-interaction.mjs';
import { resolveRequestErrorMessage } from '~/utils/request-error';

const route = useRoute();
const identifier = computed(() => String(route.params.identifier ?? ''));
const { addToast } = useAppToast();
const { settings, fetchSiteSettings } = useSiteSettings();

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

markdown.renderer.rules.table_open = () => '<div class="markdown-table-wrap"><table>';
markdown.renderer.rules.table_close = () => '</table></div>';

const imageHtmlTagPattern = /<img\b[^>]*>/gi;
const imageHtmlPlaceholderPattern = /BLOGIMAGEHTMLPLACEHOLDER\d+TOKEN/g;
const imageHtmlAttributePattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

await fetchSiteSettings();

const { data } = await useAsyncData(
  () => `public-post-${identifier.value}`,
  () => $fetch<PublicPostDetailResponse>(`/api/posts/${identifier.value}`),
  {
    watch: [identifier],
  },
);
const post = computed(() => data.value?.post ?? null);
const prevPost = computed(() => data.value?.prevPost ?? null);
const nextPost = computed(() => data.value?.nextPost ?? null);

useSitePageTitle(() => post.value?.title ?? '文章');

useSeoMeta({
  description: () => post.value?.excerpt || settings.value.site.description,
});

const likedPostIdsCookie = useCookie<string>(postLikedIdsCookieKey, {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 365,
});
const isLiked = computed(() => {
  if (!post.value) {
    return false;
  }

  return hasLikedPost(likedPostIdsCookie.value, post.value.id);
});
const likes = ref(0);
const views = ref(0);
const submittingLike = ref(false);

const renderedContent = computed(() => {
  if (!post.value) {
    return '';
  }
  return renderWhitelistedImageHtml(post.value?.contentMarkdown ?? '');
});

watch(
  post,
  async (value) => {
    likes.value = value?.likesCount ?? 0;
    views.value = value?.viewsCount ?? 0;
    submittingLike.value = false;
    if (import.meta.client) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Emit event for navbar
      window.dispatchEvent(new CustomEvent('update-post-title', { detail: value?.title ?? '' }));
    }

    if (!import.meta.client || !value) {
      return;
    }

    syncLikedPostIds();
    await increasePostViews(value);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.dispatchEvent(new CustomEvent('update-post-title', { detail: '' }));
  }
});


function syncViewedAtStorage(now = Date.now()) {
  const nextViewedAtMap = readPostViewedAtMap(localStorage.getItem(postViewedAtStorageKey), now);
  localStorage.setItem(postViewedAtStorageKey, JSON.stringify(nextViewedAtMap));
}

function syncLikedPostIds() {
  const likedPostIdsValue = mergeLikedPostIds(likedPostIdsCookie.value, localStorage.getItem(postLikedIdsStorageKey));
  likedPostIdsCookie.value = likedPostIdsValue;
  localStorage.setItem(postLikedIdsStorageKey, likedPostIdsValue);
}

function applyInteractionResponse(currentPostId: number, response: PublicPostInteractionResponse) {
  if (post.value?.id !== currentPostId) {
    return;
  }

  views.value = response.viewsCount;
  likes.value = response.likesCount;
}

async function increasePostViews(currentPost: PublicPostDetail) {
  const now = Date.now();
  syncViewedAtStorage(now);

  const viewedAtRawValue = localStorage.getItem(postViewedAtStorageKey);
  if (!shouldCountPostView(viewedAtRawValue, currentPost.id, now)) {
    return;
  }

  try {
    const response = await $fetch<PublicPostInteractionResponse>(`/api/posts/${identifier.value}/views`, {
      method: 'POST',
    });
    localStorage.setItem(postViewedAtStorageKey, rememberPostView(viewedAtRawValue, currentPost.id, now));
    applyInteractionResponse(currentPost.id, response);
    await refreshNuxtData('post-insights');
  } catch {
    views.value = currentPost.viewsCount;
  }
}

async function toggleLike() {
  if (!import.meta.client || !post.value || isLiked.value || submittingLike.value) {
    return;
  }

  submittingLike.value = true;
  const currentPost = post.value;

  try {
    const response = await $fetch<PublicPostInteractionResponse>(`/api/posts/${identifier.value}/likes`, {
      method: 'POST',
    });
    likedPostIdsCookie.value = rememberLikedPost(likedPostIdsCookie.value, currentPost.id);
    localStorage.setItem(postLikedIdsStorageKey, likedPostIdsCookie.value);
    applyInteractionResponse(currentPost.id, response);
    await refreshNuxtData('post-insights');
  } catch (error) {
    addToast(resolveRequestErrorMessage(error, '文章点赞失败'), 'error');
  } finally {
    submittingLike.value = false;
  }
}

function resolveShareUrl() {
  if (import.meta.client && window.location.href) {
    return window.location.href;
  }

  return `${settings.value.site.url.replace(/\/+$/, '')}/post/${identifier.value}`;
}

async function shareArticle() {
  if (!import.meta.client || !post.value) {
    return;
  }

  const currentPost = post.value;
  const shareUrl = resolveShareUrl();
  const shareText = currentPost.excerpt.trim() || currentPost.title;

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: currentPost.title,
        text: shareText,
        url: shareUrl,
      });
      return;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast('文章链接已复制', 'success');
      return;
    } catch {
      // Fall through to the shared warning toast.
    }
  }

  addToast('当前环境暂不支持分享，请手动复制地址栏链接', 'warning');
}

function renderWhitelistedImageHtml(contentMarkdown: string) {
  const imageHtmlPlaceholders = new Map<string, string>();
  const markdownWithPlaceholders = contentMarkdown.replace(imageHtmlTagPattern, (tagSource) => {
    const sanitizedImageTag = sanitizeImageHtmlTag(tagSource);
    if (!sanitizedImageTag) {
      return '';
    }

    const placeholder = `BLOGIMAGEHTMLPLACEHOLDER${imageHtmlPlaceholders.size}TOKEN`;
    imageHtmlPlaceholders.set(placeholder, sanitizedImageTag);
    return placeholder;
  });
  const renderedHtml = markdown.render(markdownWithPlaceholders);
  return renderedHtml.replace(imageHtmlPlaceholderPattern, (placeholder) => imageHtmlPlaceholders.get(placeholder) ?? '');
}

function sanitizeImageHtmlTag(tagSource: string) {
  if (!/^<img\b/i.test(tagSource)) {
    return '';
  }

  const sanitizedAttributes: Record<string, string> = {};

  for (const match of tagSource.matchAll(imageHtmlAttributePattern)) {
    const attributeName = (match[1] ?? '').toLowerCase();
    const rawValue = match[2] ?? match[3] ?? match[4] ?? '';

    if (attributeName === 'src') {
      const sanitizedSrc = sanitizeImageSrc(rawValue);
      if (sanitizedSrc) {
        sanitizedAttributes.src = sanitizedSrc;
      }
      continue;
    }

    if (attributeName === 'alt' || attributeName === 'title') {
      sanitizedAttributes[attributeName] = rawValue.trim();
      continue;
    }

    if (attributeName === 'width' || attributeName === 'height') {
      const sanitizedDimension = sanitizeImageDimension(rawValue);
      if (sanitizedDimension) {
        sanitizedAttributes[attributeName] = sanitizedDimension;
      }
    }
  }

  if (!sanitizedAttributes.src) {
    return '';
  }

  const imageAttributes = [
    `src="${escapeHtmlAttribute(sanitizedAttributes.src)}"`,
    Object.hasOwn(sanitizedAttributes, 'alt') ? `alt="${escapeHtmlAttribute(sanitizedAttributes.alt ?? '')}"` : '',
    Object.hasOwn(sanitizedAttributes, 'title') ? `title="${escapeHtmlAttribute(sanitizedAttributes.title ?? '')}"` : '',
    sanitizedAttributes.width ? `width="${sanitizedAttributes.width}"` : '',
    sanitizedAttributes.height ? `height="${sanitizedAttributes.height}"` : ''
  ].filter(Boolean).join(' ');

  return `<img ${imageAttributes}>`;
}

function sanitizeImageSrc(rawValue: string) {
  const normalizedValue = rawValue.trim();
  if (!normalizedValue) {
    return '';
  }

  if (/^\/(?!\/)/.test(normalizedValue)) {
    return normalizedValue;
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  return '';
}

function sanitizeImageDimension(rawValue: string) {
  const numericValue = Number.parseInt(rawValue.trim(), 10);
  return Number.isFinite(numericValue) && numericValue > 0 ? String(numericValue) : '';
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
</script>

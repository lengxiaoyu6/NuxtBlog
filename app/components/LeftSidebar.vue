<template>
  <aside class="sticky top-24 space-y-8">
    <div
      class="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm paper-texture dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="group relative mb-6 inline-block">
        <div class="absolute inset-0 rounded-full bg-brand-500 blur-xl opacity-20 transition-opacity group-hover:opacity-40" />
        <img
          :src="settings.owner.avatarUrl"
          :alt="settings.owner.name"
          class="relative h-24 w-24 cursor-pointer rounded-full border-4 border-white object-cover shadow-lg transition-transform duration-700 hover:rotate-[360deg] dark:border-slate-800"
          referrerpolicy="no-referrer"
        >
      </div>

      <h2 class="mb-2 font-serif text-xl font-bold text-slate-900 dark:text-white">{{ settings.owner.name }}</h2>
      <p class="mb-6 font-sans text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {{ settings.owner.bio }}
      </p>

      <div v-if="settings.socialLinks.length" class="flex justify-center gap-4 text-slate-400">
        <component
          :is="isExternalTarget(link.url) ? 'a' : 'NuxtLink'"
          v-for="link in enabledSocialLinks"
          :key="link.id"
          :href="isExternalTarget(link.url) ? link.url : undefined"
          :to="isExternalTarget(link.url) ? undefined : link.url"
          :target="isExternalTarget(link.url) ? '_blank' : undefined"
          :rel="isExternalTarget(link.url) ? 'noopener noreferrer' : undefined"
          class="transition-colors hover:text-brand-600 dark:hover:text-brand-400"
          :aria-label="link.label"
        >
          <component :is="socialIconMap[link.icon]" :size="20" />
        </component>
      </div>
    </div>

    <div
      class="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm paper-texture dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 class="mb-6 flex items-center gap-2 font-serif text-sm font-bold text-slate-900 dark:text-white">
        <Layout :size="16" class="text-brand-600" />
        页面导航
      </h3>
      <div v-if="enabledPages.length" class="grid grid-cols-2 gap-3">
        <NuxtLink
          v-for="page in enabledPages"
          :key="page.key"
          :to="page.path"
          class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-600 transition-all hover:bg-brand-50 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-brand-900/30 dark:hover:text-brand-400"
        >
          {{ page.label }}
        </NuxtLink>
      </div>
    </div>

    <div
      class="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm paper-texture dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 class="mb-6 flex items-center gap-2 font-serif text-sm font-bold text-slate-900 dark:text-white">
        <Folder :size="16" class="text-brand-600" />
        文章分类
      </h3>
      <div class="space-y-3">
        <NuxtLink
          v-for="category in categories"
          :key="category.name"
          :to="category.name === '全部' ? '/' : { path: '/', query: { category: category.name } }"
          class="group flex cursor-pointer items-center justify-between"
        >
          <span class="text-sm text-slate-600 transition-colors group-hover:text-brand-600 dark:text-slate-400">
            {{ category.name }}
          </span>
          <span
            class="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
          >
            {{ category.count }}
          </span>
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Folder, Github, Globe, Layout, Linkedin, Mail, Twitter } from 'lucide-vue-next';
import { usePageSettings } from '~/composables/usePageSettings';
import { useSiteSettings } from '~/composables/useSiteSettings';
import type { PostInsightsResponse } from '~/types/post-discovery';
import type { SiteSocialIcon } from '~/types/admin-settings';

const { settings } = useSiteSettings();
const { enabledPages } = usePageSettings();
const { data: insights } = await useFetch<PostInsightsResponse>('/api/posts/insights', {
  key: 'post-insights',
  default: () => ({
    categories: [],
    popularPosts: [],
    tags: [],
    stats: null,
  }),
});

const socialIconMap: Record<SiteSocialIcon, typeof Github> = {
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  mail: Mail,
  website: Globe,
};

const enabledSocialLinks = computed(() =>
  [...settings.value.socialLinks]
    .filter((item) => item.enabled && item.url.trim())
    .sort((left, right) => left.order - right.order)
);

const categories = computed(() => {
  const items = insights.value.categories;
  const totalCount = insights.value.stats?.postCount ?? items.reduce((count, item) => count + item.count, 0);

  return [
    { name: '全部', count: totalCount },
    ...items,
  ];
});

function isExternalTarget(target: string) {
  return /^(https?:\/\/|mailto:)/.test(target);
}
</script>

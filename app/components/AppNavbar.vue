<template>
  <nav
    :class="[
      'fixed left-0 right-0 top-0 z-50',
      scrolled
        ? 'glass py-3 shadow-lg shadow-slate-200/50 dark:shadow-none'
        : 'bg-white/50 py-6 dark:bg-slate-900/50',
    ]"
  >
    <div
      class="absolute left-0 top-0 h-1 bg-brand-600 transition-all duration-150"
      :style="{ width: `${readingProgress}%` }"
    />
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="group flex shrink-0 items-center gap-2 cursor-pointer">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-serif font-bold text-white shadow-lg shadow-brand-500/20 transition-all group-hover:rotate-12"
          >
            {{ brandMark }}
          </div>
          <span v-if="!isPostPage || !scrolled" class="font-serif text-lg font-bold tracking-tight dark:text-white">
            {{ settings.site.name }}
          </span>
        </NuxtLink>

        <div
          v-if="isPostPage && scrolled"
          class="mx-8 hidden flex-grow truncate font-serif text-sm font-bold text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-500 dark:text-slate-100 md:block"
        >
          {{ postTitle }}
        </div>

        <div v-if="settings.navItems.length" class="hidden items-center gap-8 md:flex">
          <template v-for="link in links" :key="link.id">
            <a
              v-if="link.isExternal"
              :href="link.path"
              :target="link.openInNewTab ? '_blank' : undefined"
              :rel="link.openInNewTab || link.isExternal ? 'noopener noreferrer' : undefined"
              :class="[
                'group relative text-sm font-medium transition-colors',
                isActive(link)
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400',
              ]"
            >
              {{ link.label }}
              <span
                :class="[
                  'absolute -bottom-1 left-0 h-0.5 bg-brand-500 transition-all',
                  isActive(link) ? 'w-full' : 'w-0 group-hover:w-full',
                ]"
              />
            </a>
            <NuxtLink
              v-else
              :to="link.path"
              :class="[
                'group relative text-sm font-medium transition-colors',
                isActive(link)
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400',
              ]"
            >
              {{ link.label }}
              <span
                :class="[
                  'absolute -bottom-1 left-0 h-0.5 bg-brand-500 transition-all',
                  isActive(link) ? 'w-full' : 'w-0 group-hover:w-full',
                ]"
              />
            </NuxtLink>
          </template>

          <div class="mx-2 h-4 w-px bg-slate-200 dark:bg-slate-800" />

          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-search"
              aria-label="搜索"
              class="rounded-full"
              @click="launchSearch()"
            />
            <UButton
              color="neutral"
              variant="ghost"
              :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
              aria-label="切换深色模式"
              class="rounded-full"
              @click="toggleTheme"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 md:hidden">
          <UButton
            color="neutral"
            variant="ghost"
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            aria-label="切换深色模式"
            @click="toggleTheme"
          />
          <UButton
            color="neutral"
            variant="ghost"
            :icon="isOpen ? 'i-lucide-x' : 'i-lucide-menu'"
            aria-label="展开菜单"
            @click="isOpen = !isOpen"
          />
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="isOpen"
        class="absolute left-0 right-0 top-full border-b border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 md:hidden"
      >
        <div class="space-y-6 px-6 py-8">
          <div v-if="settings.navItems.length">
            <template v-for="link in links" :key="`mobile-${link.id}`">
              <a
                v-if="link.isExternal"
                :href="link.path"
                :target="link.openInNewTab ? '_blank' : undefined"
                :rel="link.openInNewTab || link.isExternal ? 'noopener noreferrer' : undefined"
                :class="[
                  'block text-lg font-medium transition-colors',
                  isActive(link)
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-700 hover:text-brand-600 dark:text-slate-300',
                ]"
                @click="handleMobileNavClick"
              >
                {{ link.label }}
              </a>
              <NuxtLink
                v-else
                :to="link.path"
                :class="[
                  'block text-lg font-medium transition-colors',
                  isActive(link)
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-700 hover:text-brand-600 dark:text-slate-300',
                ]"
                @click="handleMobileNavClick"
              >
                {{ link.label }}
              </NuxtLink>
            </template>
          </div>
          <div class="flex items-center gap-4 pt-4">
            <div
              class="flex flex-grow items-center gap-2 rounded-full bg-slate-100 px-4 py-2 dark:bg-slate-800"
            >
              <Search :size="16" class="text-slate-400" />
              <input
                v-model.trim="mobileSearchText"
                type="text"
                placeholder="搜索文章..."
                class="w-full border-none bg-transparent text-sm outline-none dark:text-white"
                @focus="launchSearch(mobileSearchText)"
                @keydown.enter.prevent="launchSearch(mobileSearchText)"
              >
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Search } from 'lucide-vue-next';
import { useSiteSettings } from '~/composables/useSiteSettings';
import { usePageSettings } from '~/composables/usePageSettings';

const { settings } = useSiteSettings();
const { managedPageEnabledMap } = usePageSettings();

const links = computed(() =>
  [...settings.value.navItems]
    .filter((item) => item.enabled && item.href.trim() && isManagedPageVisible(item.href.trim()))
    .sort((left, right) => left.order - right.order)
    .map((item) => ({
      id: item.id,
      label: item.label,
      path: item.href,
      openInNewTab: item.openInNewTab,
      isExternal: /^(https?:\/\/|mailto:)/.test(item.href),
    }))
);

const brandMark = computed(() => settings.value.site.name.trim().charAt(0).toUpperCase() || 'T');
const route = useRoute();
const colorMode = useColorMode();
const { openSearch } = useSearchDialog();
const isOpen = ref(false);
const mobileSearchText = ref('');
const scrolled = ref(false);
const readingProgress = ref(0);
const isPostPage = computed(() => route.name === 'post-id');
const postTitle = ref('');

function isManagedPageVisible(path: string) {
  return managedPageEnabledMap.value[path] ?? true;
}

if (import.meta.client) {
  window.addEventListener('update-post-title', ((event: CustomEvent) => {
    postTitle.value = event.detail;
  }) as EventListener);
}

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => {
    colorMode.preference = value ? 'dark' : 'light';
  },
});

function handleScroll() {
  scrolled.value = window.scrollY > 10;

  if (isPostPage.value) {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    readingProgress.value = height > 0 ? (winScroll / height) * 100 : 0;
  }
}

function toggleTheme() {
  isDark.value = !isDark.value;
}

function isActive(link: { path: string; isExternal: boolean }) {
  return !link.isExternal && route.path === link.path;
}

function handleMobileNavClick() {
  isOpen.value = false;
}

function launchSearch(initial = '') {
  isOpen.value = false;
  openSearch(initial);
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

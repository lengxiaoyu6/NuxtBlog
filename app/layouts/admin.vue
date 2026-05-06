<template>
  <div class="admin-theme-shell relative min-h-screen overflow-hidden text-slate-950 antialiased dark:text-white">
    <div class="pointer-events-none absolute inset-0 bg-noise" />
    <div class="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_68%)] dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.22),_transparent_70%)]" />

    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        @click="isSidebarOpen = false"
      />
    </Transition>

    <aside
      class="admin-theme-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col transition-transform duration-300 lg:translate-x-0 lg:shadow-none"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      aria-label="后台导航"
    >
      <div class="flex h-20 items-center justify-between px-5">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-3">
          <div class="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
            <UIcon name="i-lucide-feather" class="size-5" />
          </div>
          <div class="min-w-0">
            <p class="truncate text-base font-black tracking-tight text-slate-950 dark:text-white">{{ siteTitle }}</p>
            <p class="truncate text-xs text-slate-500 dark:text-slate-400">博客内容管理后台</p>
          </div>
        </NuxtLink>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          class="lg:hidden"
          aria-label="关闭导航"
          @click="isSidebarOpen = false"
        />
      </div>

      <div class="flex-1 space-y-6 overflow-y-auto px-4 pb-6">
        <section v-for="group in adminNavGroups" :key="group.label" class="space-y-2">
          <p class="px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            {{ group.label }}
          </p>
          <nav class="space-y-1">
            <NuxtLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-all"
              :class="isCurrentPath(item.to)
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                : 'text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-white'"
              @click="isSidebarOpen = false"
            >
              <UIcon :name="item.icon" class="size-5 shrink-0" />
              <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
            </NuxtLink>
          </nav>
        </section>
      </div>

      <div class="border-t border-white/60 p-4 dark:border-slate-800/70">
        <div class="admin-theme-card rounded-[1.75rem] p-4">
          <div class="mb-3 flex items-center gap-3">
            <UAvatar alt="Admin" size="md" icon="i-lucide-user" />
            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-slate-950 dark:text-white">{{ adminDisplayName }}</p>
              <p class="truncate text-xs text-slate-500 dark:text-slate-400">Administrator</p>
            </div>
          </div>
          <UButton
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
      </div>
    </aside>

    <div class="relative lg:pl-72">
      <header class="admin-theme-header sticky top-0 z-30">
        <div class="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            class="lg:hidden"
            aria-label="打开导航"
            @click="isSidebarOpen = true"
          />

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-slate-500 dark:text-slate-400">{{ currentNavGroup }}</p>
            <h1 class="truncate text-base font-black text-slate-950 sm:text-lg dark:text-white">{{ currentPageTitle }}</h1>
          </div>

          <div class="hidden min-w-0 flex-1 items-center justify-end md:flex">
            <UInput
              v-model="keyword"
              icon="i-lucide-search"
              placeholder="搜索文章、评论、媒体资源"
              class="w-full max-w-sm"
              size="lg"
            />
          </div>

          <UButton icon="i-lucide-bell" color="neutral" variant="ghost" aria-label="通知" />
          <UButton
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            color="neutral"
            variant="ghost"
            aria-label="切换主题"
            @click="toggleTheme"
          />
          <UAvatar alt="Admin" icon="i-lucide-user" size="sm" class="hidden sm:inline-flex" />
        </div>
      </header>

      <main class="relative mx-auto w-full max-w-[1680px] space-y-6 px-4 py-6 sm:px-5 sm:py-8 lg:px-8 2xl:px-10">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { adminNavGroups, adminNavItems, type AdminNavItem } from '~/constants/admin-navigation';
import { DEFAULT_SITE_SETTINGS } from '~/constants/site-settings';
import type { AdminSessionUser } from '~~/shared/types/auth';

const route = useRoute();
const { settings, fetchSiteSettings } = useSiteSettings();
const { user, fetch: fetchUserSession } = useUserSession();
const isSidebarOpen = ref(false);
const isLoggingOut = ref(false);
const keyword = ref('');
const colorMode = useColorMode();

await fetchSiteSettings({ admin: true });

const isDark = computed(() => colorMode.value === 'dark');

function isCurrentPath(path: string) {
  if (route.path === path) {
    return true;
  }

  if (path === '/admin/modules' && route.path.startsWith('/admin/modules/')) {
    return true;
  }

  const item = adminNavItems.find((navItem) => navItem.to === path) as AdminNavItem | undefined;
  return item?.match?.some((matcher) => matcher.endsWith('/') ? route.path.startsWith(matcher) : route.path === matcher) ?? false;
}

const currentNavItem = computed(() => {
  return adminNavItems.find((item) => isCurrentPath(item.to)) ?? adminNavItems[0];
});

const siteTitle = computed(() => settings.value.site.name.trim() || DEFAULT_SITE_SETTINGS.site.name);
const currentPageTitle = computed(() => {
  if (route.path === '/admin/posts/new') {
    return typeof route.query.id === 'string' && route.query.id.trim()
      ? '编辑文章'
      : '新建文章';
  }

  return currentNavItem.value?.label || '管理后台';
});
const currentNavGroup = computed(() => currentNavItem.value?.group || '后台首页');
const sessionUser = computed(() => user.value as AdminSessionUser | null | undefined);
const adminDisplayName = computed(() => sessionUser.value?.displayName || '管理员');

useSitePageTitle(currentPageTitle);

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark';
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

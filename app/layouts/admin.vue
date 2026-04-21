<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex text-slate-900 dark:text-slate-100">
    <!-- Overlay for mobile sidebar -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isSidebarOpen" 
        @click="isSidebarOpen = false"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
      />
    </Transition>

    <!-- Sidebar -->
    <aside 
      class="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed inset-y-0 z-[70] transition-transform duration-300 lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'"
    >
      <div class="p-6 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div class="p-2 bg-brand-600 rounded-xl shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
            <LayoutDashboard class="text-white" :size="20" />
          </div>
          <span class="font-black text-xl font-serif tracking-tight">{{ siteTitle }}</span>
        </NuxtLink>
        <button @click="isSidebarOpen = false" class="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white">
          <X :size="20" />
        </button>
      </div>

      <nav class="flex-grow px-4 mt-4 overflow-y-auto">
        <section
          v-for="group in navGroups"
          :key="group.label"
          class="mb-6 space-y-1"
        >
          <p class="px-4 pb-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
            {{ group.label }}
          </p>
          <NuxtLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            @click="isSidebarOpen = false"
            class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
            :class="[
              isCurrentPath(item.path)
                ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <component :is="item.icon" :size="20" :class="isCurrentPath(item.path) ? 'text-brand-600' : 'group-hover:text-slate-900 dark:group-hover:text-white'" />
            <span class="text-sm font-bold">{{ item.label }}</span>
          </NuxtLink>
        </section>
      </nav>

      <div class="p-4 border-t border-slate-100 dark:border-slate-800">
        <button
          :disabled="isLoggingOut"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all font-bold text-sm disabled:cursor-not-allowed disabled:opacity-70"
          @click="handleLogout"
        >
          <LogOut :size="20" />
          {{ isLoggingOut ? '退出中...' : '退出登录' }}
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-grow min-h-screen flex flex-col transition-all duration-300" :class="{'lg:ml-64': true}">
      <header class="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="isSidebarOpen = true" class="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Menu :size="24" />
          </button>
          <h1 class="font-bold text-lg hidden sm:block">{{ currentNavLabel }}</h1>
        </div>
        
        <div class="flex items-center gap-4">
          <button class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <Bell :size="20" />
          </button>
          <div class="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div class="flex items-center gap-3">
            <img src="https://picsum.photos/seed/admin/100/100" class="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
            <span class="text-sm font-bold hidden sm:inline-block">{{ adminDisplayName }}</span>
          </div>
        </div>
      </header>

      <main class="p-4 sm:p-8 flex-grow overflow-x-hidden">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DEFAULT_SITE_SETTINGS } from '~/constants/site-settings';
import type { AdminSessionUser } from '~~/shared/types/auth';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Image as ImageIcon, 
  FolderTree,
  FolderKanban,
  Link2,
  MessageCircleMore,
  Settings, 
  Package,
  LogOut,
  Bell,
  Menu,
  UserRound,
  X
} from 'lucide-vue-next';

const route = useRoute();
const { settings, fetchSiteSettings } = useSiteSettings();
const { user, fetch: fetchUserSession } = useUserSession();
const isSidebarOpen = ref(false);
const isLoggingOut = ref(false);

await fetchSiteSettings({ admin: true });

const navGroups = [
  {
    label: '内容管理',
    items: [
      { label: '仪表盘', path: '/admin', icon: LayoutDashboard },
      { label: '文章管理', path: '/admin/posts', icon: FileText },
      { label: '文章分类', path: '/admin/categories', icon: FolderTree },
      { label: '评论管理', path: '/admin/comments', icon: MessageSquare },
      { label: '媒体库', path: '/admin/media', icon: ImageIcon },
    ],
  },
  {
    label: '页面管理',
    items: [
      { label: '关于我', path: '/admin/pages/about', icon: UserRound },
      { label: '留言板', path: '/admin/pages/guestbook', icon: MessageCircleMore },
      { label: '友情链接', path: '/admin/pages/links', icon: Link2 },
      { label: '项目展示', path: '/admin/pages/projects', icon: FolderKanban },
    ],
  },
  {
    label: '系统配置',
    items: [
      { label: '系统设置', path: '/admin/settings', icon: Settings },
      { label: '模块插件', path: '/admin/modules', icon: Package },
    ],
  },
];

function isCurrentPath(path: string) {
  if (route.path === path) {
    return true;
  }

  if (path === '/admin/modules' && route.path.startsWith('/admin/modules/')) {
    return true;
  }

  return false;
}

const currentNavLabel = computed(() => {
  return navGroups
    .flatMap((group) => group.items)
    .find((item) => isCurrentPath(item.path))?.label || '管理后台';
});

const siteTitle = computed(() => settings.value.site.name.trim() || DEFAULT_SITE_SETTINGS.site.name);
const currentPageTitle = computed(() => {
  if (route.path === '/admin/posts/new') {
    return typeof route.query.id === 'string' && route.query.id.trim()
      ? '编辑文章'
      : '新建文章';
  }

  return currentNavLabel.value;
});
const sessionUser = computed(() => user.value as AdminSessionUser | null | undefined);
const adminDisplayName = computed(() => sessionUser.value?.displayName || '管理员');

useSitePageTitle(currentPageTitle);

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

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('admin ui refactor', () => {
  it('uses shared navigation metadata and a dedicated admin theme shell in the admin layout', () => {
    const source = readSource('app/layouts/admin.vue');
    const cssSource = readSource('app/assets/css/main.css');

    expect(source).toContain("from '~/constants/admin-navigation'");
    expect(source).toContain('admin-theme-shell');
    expect(source).toContain('admin-theme-sidebar');
    expect(source).toContain('admin-theme-header');
    expect(source).toContain('max-w-[1680px]');
    expect(source).toContain('px-4 py-6 sm:px-5 sm:py-8 lg:px-8 2xl:px-10');
    expect(source).toContain('UIcon');
    expect(source).toContain('UButton');
    expect(source).toContain('UAvatar');
    expect(source).toContain('useColorMode()');
    expect(source).toContain("route.path.startsWith('/admin/modules/')");
    expect(source).not.toContain("from 'lucide-vue-next'");

    expect(cssSource).toContain('.admin-theme-shell');
    expect(cssSource).toContain('.dark .admin-theme-shell');
    expect(cssSource).toContain('.admin-theme-card');
    expect(cssSource).toContain('radial-gradient(circle at top left');
    expect(cssSource).toContain('--admin-brand-500');
  });

  it('moves admin authentication pages onto the shared auth shell and Nuxt UI form controls', () => {
    const loginSource = readSource('app/pages/admin/login.vue');
    const passwordSetupSource = readSource('app/pages/admin/password-setup.vue');
    const authShellSource = readSource('app/components/admin/AdminAuthShell.vue');

    expect(authShellSource).toContain('admin-theme-shell');
    expect(authShellSource).toContain('UButton');
    expect(authShellSource).toContain('UIcon');

    for (const source of [loginSource, passwordSetupSource]) {
      expect(source).toContain('AdminAuthShell');
      expect(source).toContain('UButton');
      expect(source).toContain('UInput');
      expect(source).not.toContain("from 'lucide-vue-next'");
    }

    expect(authShellSource).toContain('loginOnly');
    expect(authShellSource).toContain('v-if="!loginOnly"');
    expect(authShellSource).toContain('mx-auto mb-5 grid size-16');
    expect(authShellSource).toContain("loginOnly ? 'border-transparent text-center'");
    expect(authShellSource).toContain("loginOnly ? 'p-8 sm:p-10'");

    expect(loginSource).toContain('login-only');
    expect(loginSource).toContain('class="w-full"');
    expect(loginSource).toContain('TurnstileWidget');
    expect(loginSource).toContain('redirectPath');
    expect(loginSource).not.toContain('内容管理门户');
    expect(loginSource).not.toContain('登录后继续维护文章、评论、媒体资源与模块插件配置。');
    expect(loginSource).not.toContain('保持会话状态');
    expect(loginSource).not.toContain('form.remember');
    expect(loginSource).not.toContain('USwitch');
    expect(passwordSetupSource).toContain('handleLogout');
    expect(passwordSetupSource).toContain('feedbackMessage');
  });

  it('moves the post editor onto the template-based Nuxt UI shell', () => {
    const source = readSource('app/pages/admin/posts/new.vue');

    expect(source).toContain('UCard');
    expect(source).toContain('UButton');
    expect(source).toContain('UIcon');
    expect(source).toContain('xl:grid-cols-[18rem_minmax(0,1fr)_20rem]');
    expect(source).toContain('openCoverImagePicker');
    expect(source).toContain('submitPost');
    expect(source).not.toContain("from 'lucide-vue-next'");
  });

  it('defines admin navigation with icon names for all current admin routes', () => {
    const source = readSource('app/constants/admin-navigation.ts');

    for (const route of [
      '/admin',
      '/admin/posts',
      '/admin/categories',
      '/admin/comments',
      '/admin/media',
      '/admin/pages/about',
      '/admin/pages/guestbook',
      '/admin/pages/links',
      '/admin/pages/projects',
      '/admin/settings',
      '/admin/modules',
    ]) {
      expect(source).toContain(`to: '${route}'`);
    }

    expect(source).toContain('i-lucide-layout-dashboard');
    expect(source).toContain('export const adminNavItems');
  });

  it('updates dashboard, posts and comments pages to Nuxt UI based responsive surfaces', () => {
    const dashboardSource = readSource('app/pages/admin/index.vue');
    const postsSource = readSource('app/pages/admin/posts/index.vue');
    const commentsSource = readSource('app/pages/admin/comments.vue');

    expect(dashboardSource).toContain('UCard');
    expect(dashboardSource).toContain('UIcon');
    expect(dashboardSource).not.toContain("from 'lucide-vue-next'");

    expect(postsSource).toContain('UCard');
    expect(postsSource).toContain('UButton');
    expect(postsSource).toContain('md:hidden');
    expect(postsSource).not.toContain("from 'lucide-vue-next'");

    expect(commentsSource).toContain('UCard');
    expect(commentsSource).toContain('UBadge');
    expect(commentsSource).toContain('replyToSummary');
    expect(commentsSource).not.toContain("from 'lucide-vue-next'");
  });

  it('updates media, settings, modules and page management surfaces to Nuxt UI components', () => {
    const mediaSource = readSource('app/pages/admin/media.vue');
    const settingsSource = readSource('app/pages/admin/settings.vue');
    const modulesSource = readSource('app/pages/admin/modules/index.vue');
    const moduleDetailSource = readSource('app/pages/admin/modules/[moduleKey].vue');

    for (const source of [mediaSource, settingsSource, modulesSource, moduleDetailSource]) {
      expect(source).toContain('UCard');
      expect(source).toContain('UButton');
      expect(source).toContain('UIcon');
      expect(source).not.toContain("from 'lucide-vue-next'");
    }

    expect(mediaSource).toContain('grid grid-cols-1 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]');
    expect(settingsSource).toContain('UFormField');
    expect(settingsSource).toContain('USwitch');
    expect(modulesSource).toContain('grid gap-4 sm:grid-cols-2 xl:grid-cols-3');
    expect(moduleDetailSource).toContain('grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]');
  });

  it('renders the settings overview only inside the security tab content', () => {
    const source = readSource('app/pages/admin/settings.vue');
    const securityTabStart = source.indexOf(`v-else-if="activeTab === 'security'"`);

    expect(securityTabStart).toBeGreaterThan(-1);
    expect(source.slice(0, securityTabStart)).not.toContain('配置概览');
    expect(source.slice(securityTabStart)).toContain('配置概览');
  });

  it('applies admin theme cards across shared admin pages and media surfaces', () => {
    for (const path of [
      'app/pages/admin/settings.vue',
      'app/pages/admin/modules/index.vue',
      'app/pages/admin/modules/[moduleKey].vue',
      'app/pages/admin/media.vue',
      'app/components/admin/media/MediaAssetCard.vue',
      'app/components/admin/media/MediaAssetTable.vue',
      'app/components/admin/media/MediaBulkToolbar.vue',
      'app/components/admin/media/MediaInspectorPanel.vue',
      'app/components/admin/media/MediaSummaryRow.vue',
      'app/components/admin/media/MediaUploadPanel.vue',
    ]) {
      const source = readSource(path);
      expect(source).toContain('admin-theme-card');
    }
  });

  it('keeps secondary admin pages on shared Nuxt UI shells without replacing business logic', () => {
    for (const path of [
      'app/pages/admin/pages/about.vue',
      'app/pages/admin/pages/guestbook.vue',
      'app/pages/admin/pages/links.vue',
      'app/pages/admin/pages/projects.vue',
    ]) {
      const source = readSource(path);
      expect(source).toContain('UCard');
      expect(source).toContain('UButton');
      expect(source).toContain('UIcon');
      expect(source).toContain('savePageSettings');
      expect(source).not.toContain("from 'lucide-vue-next'");
    }
  });

  it('renders admin projects management with card editor components and modal editing state', () => {
    const source = readSource('app/pages/admin/pages/projects.vue');

    expect(source).toContain('AdminProjectEditorCard');
    expect(source).toContain('grid gap-6 xl:grid-cols-2');
    expect(source).toContain('UModal');
    expect(source).toContain('isProjectEditorOpen');
    expect(source).toContain('editingProjectId');
    expect(source).toContain('openProjectEditor');
    expect(source).toContain('closeProjectEditor');
    expect(source).toContain("watch(isProjectEditorOpen, (open) => {");
    expect(source).toContain('if (!open) {');
    expect(source).toContain('editingProjectId.value = null;');
    expect(source).not.toContain('watch(form, () => {');
    expect(source).toContain('@edit="openProjectEditor(item.id)"');
    expect(source).toContain('syncProjectTags(editingProject.id)');
    expect(source).toContain('项目描述');
    expect(source).toContain('GitHub 链接');
  });

  it('renders admin project editor card as summary surface with edit action', () => {
    const source = readSource('app/components/admin/pages/AdminProjectEditorCard.vue');

    expect(source).toContain(`emit('edit')`);
    expect(source).toContain('rounded-[1.5rem]');
    expect(source).toContain('p-4');
    expect(source).toContain('h-40');
    expect(source).toContain('text-base');
    expect(source).toContain('min-h-[3.75rem]');
    expect(source).toContain('在前台展示');
    expect(source).toContain('编辑项目');
    expect(source).not.toContain('<label class="text-sm font-bold text-slate-900 dark:text-white">项目描述</label>');
    expect(source).not.toContain('<label class="text-sm font-bold text-slate-900 dark:text-white">GitHub 链接</label>');
    expect(source).not.toContain('<label class="text-sm font-bold text-slate-900 dark:text-white">演示链接</label>');
    expect(source).not.toContain('<label class="text-sm font-bold text-slate-900 dark:text-white">封面图片链接</label>');
  });

});

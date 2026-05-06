export interface AdminNavItem {
  label: string;
  to: string;
  icon: string;
  match?: string[];
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: '内容管理',
    items: [
      { label: '仪表盘', to: '/admin', icon: 'i-lucide-layout-dashboard' },
      { label: '文章管理', to: '/admin/posts', icon: 'i-lucide-file-text', match: ['/admin/posts/new'] },
      { label: '文章分类', to: '/admin/categories', icon: 'i-lucide-folder-tree' },
      { label: '评论管理', to: '/admin/comments', icon: 'i-lucide-message-square' },
      { label: '媒体库', to: '/admin/media', icon: 'i-lucide-image' },
    ],
  },
  {
    label: '页面管理',
    items: [
      { label: '关于我', to: '/admin/pages/about', icon: 'i-lucide-user-round' },
      { label: '留言板', to: '/admin/pages/guestbook', icon: 'i-lucide-message-circle-more' },
      { label: '友情链接', to: '/admin/pages/links', icon: 'i-lucide-link-2' },
      { label: '项目展示', to: '/admin/pages/projects', icon: 'i-lucide-folder-kanban' },
    ],
  },
  {
    label: '系统配置',
    items: [
      { label: '系统设置', to: '/admin/settings', icon: 'i-lucide-settings' },
      { label: '模块插件', to: '/admin/modules', icon: 'i-lucide-package', match: ['/admin/modules/'] },
    ],
  },
];

export const adminNavItems = adminNavGroups.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    group: group.label,
  })),
);

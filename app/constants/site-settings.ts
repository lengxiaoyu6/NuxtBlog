import { cloneSiteSecuritySettings, DEFAULT_SITE_SECURITY_SETTINGS } from '~~/shared/constants/security';
import type { AdminSettingsForm } from '~/types/admin-settings';

export const DEFAULT_SITE_SETTINGS: AdminSettingsForm = {
  site: {
    name: '个人博客',
    url: 'https://example.com',
    description: '探索技术边界，分享开发心得。专注于产品设计、前端工程与个人写作。',
    logoUrl: '',
    logoAlt: '个人博客 标志',
  },
  owner: {
    name: '个人博客',
    avatarUrl: 'https://picsum.photos/seed/techflow/200/200',
    bio: '探索技术边界，分享开发心得。专注于前端工程化、UI 设计与性能优化。',
    location: 'Shanghai, China',
    tagline: 'Based in Earth',
  },
  socialLinks: [
    {
      id: 'social-github',
      label: 'Github',
      url: 'https://github.com',
      icon: 'github',
      enabled: true,
      order: 1,
    },
    {
      id: 'social-twitter',
      label: 'Twitter',
      url: 'https://twitter.com',
      icon: 'twitter',
      enabled: true,
      order: 2,
    },
    {
      id: 'social-linkedin',
      label: 'LinkedIn',
      url: 'https://linkedin.com',
      icon: 'linkedin',
      enabled: true,
      order: 3,
    },
    {
      id: 'social-mail',
      label: '邮箱',
      url: 'mailto:hello@techflow.blog',
      icon: 'mail',
      enabled: true,
      order: 4,
    },
  ],
  navItems: [
    {
      id: 'nav-home',
      label: '首页',
      href: '/',
      openInNewTab: false,
      enabled: true,
      order: 1,
    },
    {
      id: 'nav-archives',
      label: '归档',
      href: '/archives',
      openInNewTab: false,
      enabled: true,
      order: 2,
    },
    {
      id: 'nav-projects',
      label: '项目',
      href: '/projects',
      openInNewTab: false,
      enabled: true,
      order: 3,
    },
    {
      id: 'nav-about',
      label: '关于',
      href: '/about',
      openInNewTab: false,
      enabled: true,
      order: 4,
    },
    {
      id: 'nav-links',
      label: '友链',
      href: '/links',
      openInNewTab: false,
      enabled: true,
      order: 5,
    },
    {
      id: 'nav-guestbook',
      label: '留言',
      href: '/guestbook',
      openInNewTab: false,
      enabled: true,
      order: 6,
    },
  ],
  footer: {
    contactEmail: 'hello@techflow.blog',
    copyright: '© 2026 TechFlow. Built with Nuxt & Tailwind.',
    icpText: '京ICP备2026000000号-1',
    icpLink: 'https://beian.miit.gov.cn/',
    note: '',
  },
  security: cloneSiteSecuritySettings(DEFAULT_SITE_SECURITY_SETTINGS),
};

export function cloneSiteSettings(settings: AdminSettingsForm = DEFAULT_SITE_SETTINGS): AdminSettingsForm {
  return {
    site: { ...settings.site },
    owner: { ...settings.owner },
    socialLinks: settings.socialLinks.map((item) => ({ ...item })),
    navItems: settings.navItems.map((item) => ({ ...item })),
    footer: { ...settings.footer },
    security: cloneSiteSecuritySettings(settings.security),
  };
}

import type {
  ManagedPageMeta,
  ManagedPageSettings,
} from '~/types/page-settings';

export const MANAGED_PAGE_META: ManagedPageMeta[] = [
  {
    key: 'about',
    label: '关于我',
    path: '/about',
    adminPath: '/admin/pages/about',
  },
  {
    key: 'guestbook',
    label: '留言板',
    path: '/guestbook',
    adminPath: '/admin/pages/guestbook',
  },
  {
    key: 'links',
    label: '友情链接',
    path: '/links',
    adminPath: '/admin/pages/links',
  },
  {
    key: 'projects',
    label: '项目展示',
    path: '/projects',
    adminPath: '/admin/pages/projects',
  },
];

export const DEFAULT_PAGE_SETTINGS: ManagedPageSettings = {
  about: {
    enabled: true,
    seo: {
      title: '关于我',
      description: '了解站长的技术背景、创作理念与核心技能栈。',
    },
    intro: {
      heading: 'My Story',
      paragraphs: [
        '你好！我是站长，一名热衷于构建卓越数字体验的前端工程师和 UI 设计师。',
        '在过去的几年里，我一直致力于探索技术与艺术的交汇点。我坚信，优秀的产品不仅需要强大的功能，更需要细腻的情感表达和极致的用户体验。',
        '这个博客是个人的数字花园，用来记录技术心得、设计思考以及对创作的持续观察。',
      ],
    },
    location: {
      label: '创作坐标',
    },
    skillsSection: {
      enabled: true,
      heading: 'Tech Stacks',
    },
    skills: [
      {
        id: 'about-skill-frontend',
        title: 'Frontend Ecosystem',
        subtitle: 'User Interface & Experience',
        description: '专注于构建高性能、响应式且具有极致交互体验的现代 Web 应用。深耕 React 生态，追求像素级还原与流畅动画。',
        level: 95,
        theme: 'blue',
        items: [
          { id: 'about-skill-frontend-react', name: 'React / Next.js', level: 95 },
          { id: 'about-skill-frontend-ts', name: 'TypeScript', level: 92 },
          { id: 'about-skill-frontend-tailwind', name: 'Tailwind CSS', level: 98 },
          { id: 'about-skill-frontend-three', name: 'Three.js / WebGL', level: 75 },
          { id: 'about-skill-frontend-motion', name: 'Framer Motion', level: 90 },
        ],
      },
      {
        id: 'about-skill-backend',
        title: 'Backend Architecture',
        subtitle: 'Logic & Data Systems',
        description: '设计并实现高可用、可扩展的服务端架构。擅长处理复杂业务逻辑与海量数据，确保系统稳定与安全。',
        level: 88,
        theme: 'emerald',
        items: [
          { id: 'about-skill-backend-node', name: 'Node.js / NestJS', level: 88 },
          { id: 'about-skill-backend-go', name: 'Go / Gin', level: 78 },
          { id: 'about-skill-backend-sql', name: 'PostgreSQL / MySQL', level: 85 },
          { id: 'about-skill-backend-cache', name: 'Redis / MongoDB', level: 82 },
          { id: 'about-skill-backend-api', name: 'GraphQL / gRPC', level: 75 },
        ],
      },
    ],
  },
  guestbook: {
    enabled: true,
    seo: {
      title: '留言板',
      description: '在数字会客厅留下技术交流、创作反馈或一句问候。',
    },
    commentSection: {
      title: '留言墙',
      description: '',
    },
  },
  links: {
    enabled: true,
    seo: {
      title: '友情链接',
      description: '收录优质博客与站点，也欢迎提交友链交换申请。',
    },
    friendCard: {
      name: '个人博客',
      description: '探索技术边界，分享开发心得。',
      url: 'https://example.com',
      avatarUrl: 'https://example.com/avatar.png',
    },
    friendsSection: {
      title: '友情链接列表',
    },
    friends: [
      {
        id: 'friend-astro',
        name: 'Astro Blog',
        url: 'https://astro.build',
        description: 'The web framework for content-driven websites.',
        avatarUrl: 'https://astro.build/favicon.svg',
        status: 'visible',
      },
      {
        id: 'friend-tailwind',
        name: 'Tailwind CSS',
        url: 'https://tailwindcss.com',
        description: 'A utility-first CSS framework for rapid UI development.',
        avatarUrl: 'https://tailwindcss.com/favicons/favicon-32x32.png?v=3',
        status: 'visible',
      },
      {
        id: 'friend-react',
        name: 'React Dev',
        url: 'https://react.dev',
        description: 'The library for web and native user interfaces.',
        avatarUrl: 'https://react.dev/favicon.ico',
        status: 'visible',
      },
      {
        id: 'friend-vite',
        name: 'Vite',
        url: 'https://vitejs.dev',
        description: 'Next generation frontend tooling.',
        avatarUrl: 'https://vitejs.dev/logo.svg',
        status: 'visible',
      },
      {
        id: 'friend-lucide',
        name: 'Lucide Icons',
        url: 'https://lucide.dev',
        description: 'Beautiful & consistent icons.',
        avatarUrl: 'https://lucide.dev/favicon.ico',
        status: 'pending',
      },
      {
        id: 'friend-motion',
        name: 'Framer Motion',
        url: 'https://www.framer.com/motion/',
        description: 'A production-ready motion library for React.',
        avatarUrl: 'https://www.framer.com/favicon.ico',
        status: 'hidden',
      },
    ],
  },
  projects: {
    enabled: true,
    seo: {
      title: '项目展示',
      description: '查看个人项目、实验作品与阶段性技术探索成果。',
    },
    projectsSection: {
      title: '精选项目',
    },
    projects: [
      {
        id: 'project-1',
        title: 'Minimalist Portfolio',
        description: '一个基于 React 和 Tailwind CSS 的极简个人博客模板，注重排版与阅读体验。',
        image: 'https://picsum.photos/seed/project1/800/600',
        tags: ['React', 'Tailwind', 'Framer Motion'],
        githubUrl: 'https://github.com',
        demoUrl: 'https://example.com',
        category: 'Web Design',
        enabled: true,
      },
      {
        id: 'project-2',
        title: 'AI Content Generator',
        description: '利用 Google Gemini API 构建的内容生成工具，支持多种写作风格与格式。',
        image: 'https://picsum.photos/seed/project2/800/600',
        tags: ['Next.js', 'Gemini API', 'TypeScript'],
        githubUrl: 'https://github.com',
        demoUrl: 'https://example.com',
        category: 'AI Tool',
        enabled: true,
      },
      {
        id: 'project-3',
        title: 'Crypto Dashboard',
        description: '实时追踪加密货币价格与趋势的可视化仪表盘，集成多种 API 数据源。',
        image: 'https://picsum.photos/seed/project3/800/600',
        tags: ['React', 'D3.js', 'Recharts'],
        githubUrl: 'https://github.com',
        demoUrl: '',
        category: 'Data Viz',
        enabled: true,
      },
      {
        id: 'project-4',
        title: 'Task Management System',
        description: '高效的团队协作与任务管理系统，支持看板视图与实时同步。',
        image: 'https://picsum.photos/seed/project4/800/600',
        tags: ['React', 'Firebase', 'Tailwind'],
        githubUrl: '',
        demoUrl: 'https://example.com',
        category: 'SaaS',
        enabled: true,
      },
    ],
    emptyState: {
      title: '项目暂未展示',
      description: '当前没有可展示的项目内容，请稍后再来查看。',
    },
  },
};

export function clonePageSettings(settings: ManagedPageSettings = DEFAULT_PAGE_SETTINGS): ManagedPageSettings {
  return {
    about: {
      ...settings.about,
      seo: { ...settings.about.seo },
      intro: {
        ...settings.about.intro,
        paragraphs: [...settings.about.intro.paragraphs],
      },
      location: { ...settings.about.location },
      skillsSection: { ...settings.about.skillsSection },
      skills: settings.about.skills.map((card) => ({
        ...card,
        items: card.items.map((item) => ({ ...item })),
      })),
    },
    guestbook: {
      ...settings.guestbook,
      seo: { ...settings.guestbook.seo },
      commentSection: { ...settings.guestbook.commentSection },
    },
    links: {
      ...settings.links,
      seo: { ...settings.links.seo },
      friendCard: { ...settings.links.friendCard },
      friendsSection: { ...settings.links.friendsSection },
      friends: settings.links.friends.map((item) => ({ ...item })),
    },
    projects: {
      ...settings.projects,
      seo: { ...settings.projects.seo },
      projectsSection: { ...settings.projects.projectsSection },
      projects: settings.projects.projects.map((item) => ({
        ...item,
        tags: [...item.tags],
      })),
      emptyState: { ...settings.projects.emptyState },
    },
  };
}

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  date: string;
  readTime: string;
  isPinned?: boolean;
  tags: string[];
  image?: string;
  likes?: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  github?: string;
  demo?: string;
  category: string;
}

export const PERSONAL_INFO = {
  name: '个人博客',
  bio: '探索技术边界，分享开发心得。专注于前端工程化、UI 设计与性能优化。',
  avatar: 'https://picsum.photos/seed/techflow/200/200',
  social: {
    github: 'https://github.com',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
  },
};

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: '如何设计一个极简且高效的技术博客？',
    excerpt:
      '在信息爆炸的时代，一个好的技术博客应该回归本质：清晰的排版、快速的加载速度以及优秀的阅读体验。本文将探讨如何利用现代前端技术栈构建一个个人博客。',
    content: `
## 为什么选择极简设计？

在当今互联网环境下，用户被海量的信息所包围。一个**极简**的设计不仅能减少视觉干扰，还能让读者更加专注于内容本身。

### 核心原则

1. **内容优先**：所有的设计元素都应该为内容服务。
2. **性能至上**：快速的加载速度是优秀体验的基石。
3. **响应式体验**：无论是在桌面端还是移动端，都应该有完美的阅读体验。

\`\`\`tsx
// 示例代码：一个简单的 React 组件
function Welcome() {
  return <h1>Hello, TechFlow!</h1>;
}
\`\`\`

### 技术选型

我们选择了 **React 19** 和 **Tailwind CSS 4.0**。React 提供了强大的组件化能力，而 Tailwind 则让我们能够以极低的代码量实现复杂的响应式布局。

> "Design is not just what it looks like and feels like. Design is how it works." - Steve Jobs

### 总结

构建一个博客不仅仅是写代码，更是一种生活态度的表达。希望能在这个过程中找到属于自己的风格。
    `,
    category: 'Design',
    date: '2026-03-24',
    readTime: '8 min',
    isPinned: true,
    tags: ['UI设计', '前端开发', '用户体验'],
    image: 'https://picsum.photos/seed/design/800/400',
    likes: 128,
  },
  {
    id: '2',
    title: 'React 19 新特性深度解析',
    excerpt:
      'React 19 带来了许多令人兴奋的更新，包括 Actions API、Server Components 的进一步优化以及全新的编译器。让我们一起来看看这些变化如何影响日常开发。',
    category: 'Frontend',
    date: '2026-03-22',
    readTime: '12 min',
    tags: ['React', 'JavaScript', '性能优化'],
    image: 'https://picsum.photos/seed/react19/800/400',
    likes: 85,
  },
  {
    id: '3',
    title: '使用 Tailwind CSS 4.0 构建响应式布局',
    excerpt:
      'Tailwind CSS 4.0 引入了全新的引擎和更简洁的配置方式。本文将展示如何利用其新特性快速构建一个复杂的响应式侧边栏布局。',
    category: 'CSS',
    date: '2026-03-20',
    readTime: '6 min',
    tags: ['Tailwind', 'CSS', '响应式设计'],
    image: 'https://picsum.photos/seed/tailwind4/800/400',
  },
  {
    id: '4',
    title: '2026 年前端技术栈清单',
    excerpt:
      '从 Vite 到 Astro，从 TypeScript 到 Rust-based tools。分享今年最常用的开发工具和库。',
    category: 'Tools',
    date: '2026-03-18',
    readTime: '15 min',
    tags: ['技术栈', '效率工具', '开发者体验'],
    image: 'https://picsum.photos/seed/tools/800/400',
  },
  {
    id: '5',
    title: '深入理解 TypeScript 5.4 的新特性',
    excerpt:
      'TypeScript 5.4 引入了 NoInfer 实用类型和更好的闭包类型收窄。通过实际案例展示这些特性如何提升代码质量。',
    category: 'Frontend',
    date: '2026-03-15',
    readTime: '10 min',
    tags: ['TypeScript', '编程语言', '开发技巧'],
    image: 'https://picsum.photos/seed/ts54/800/400',
  },
  {
    id: '6',
    title: '如何优化 React 应用的运行时性能？',
    excerpt:
      '性能优化不仅仅是减少包体积。本文将探讨如何利用 Profiler、memo 和 useMemo 来解决复杂的渲染瓶颈。',
    category: 'Frontend',
    date: '2026-03-12',
    readTime: '14 min',
    tags: ['React', '性能优化', '前端工程化'],
    image: 'https://picsum.photos/seed/perf/800/400',
  },
  {
    id: '7',
    title: '2026 年 Web 设计趋势展望',
    excerpt:
      '从极简主义到沉浸式体验。探讨未来一年 Web 设计在色彩、排版和交互方面的演进方向。',
    category: 'Design',
    date: '2026-03-10',
    readTime: '7 min',
    tags: ['设计趋势', 'UI/UX', '创意设计'],
    image: 'https://picsum.photos/seed/trends/800/400',
  },
  {
    id: '8',
    title: '构建高性能的 Node.js 微服务架构',
    excerpt:
      '探讨如何利用 Fastify 和 gRPC 构建可扩展、低延迟的后端服务，并实现自动化的服务发现与负载均衡。',
    category: 'Backend',
    date: '2026-03-05',
    readTime: '18 min',
    tags: ['Node.js', '微服务', '后端开发'],
    image: 'https://picsum.photos/seed/node/800/400',
  },
];

export const CATEGORIES = [
  { name: '全部', count: 28 },
  { name: 'Frontend', count: 12 },
  { name: 'Design', count: 8 },
  { name: 'CSS', count: 5 },
  { name: 'Tools', count: 3 },
  { name: 'Backend', count: 2 },
];

export const PAGES = [
  { name: '关于我', path: '/about' },
  { name: '友情链接', path: '/links' },
  { name: '项目展示', path: '/projects' },
  { name: '留言板', path: '/guestbook' },
];

export const FRIENDS = [
  {
    name: 'Astro Blog',
    url: 'https://astro.build',
    description: 'The web framework for content-driven websites.',
    avatar: 'https://astro.build/favicon.svg',
  },
  {
    name: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    description: 'A utility-first CSS framework for rapid UI development.',
    avatar: 'https://tailwindcss.com/favicons/favicon-32x32.png?v=3',
  },
  {
    name: 'React Dev',
    url: 'https://react.dev',
    description: 'The library for web and native user interfaces.',
    avatar: 'https://react.dev/favicon.ico',
  },
  {
    name: 'Vite',
    url: 'https://vitejs.dev',
    description: 'Next generation frontend tooling.',
    avatar: 'https://vitejs.dev/logo.svg',
  },
  {
    name: 'Lucide Icons',
    url: 'https://lucide.dev',
    description: 'Beautiful & consistent icons.',
    avatar: 'https://lucide.dev/favicon.ico',
  },
  {
    name: 'Framer Motion',
    url: 'https://www.framer.com/motion/',
    description: 'A production-ready motion library for React.',
    avatar: 'https://www.framer.com/favicon.ico',
  },
];

export const BLOG_STATS = {
  postCount: 28,
  runningDays: 456,
  lastActivity: '2026-03-30 15:30',
};

export const POPULAR_POSTS = [
  { id: '2', title: 'React 19 新特性深度解析', views: '1.2k', likes: 85 },
  {
    id: '1',
    title: '如何设计一个极简且高效的技术博客？',
    views: '980',
    likes: 128,
  },
  {
    id: '3',
    title: '使用 Tailwind CSS 4.0 构建响应式布局',
    views: '750',
    likes: 42,
  },
];

export const TAGS = [
  'React',
  'Astro',
  'Tailwind',
  'TypeScript',
  'Rust',
  'Next.js',
  'Vite',
  'CSS',
  'UI/UX',
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Minimalist Portfolio',
    description: '一个基于 React 和 Tailwind CSS 的极简个人博客模板，注重排版与阅读体验。',
    image: 'https://picsum.photos/seed/project1/800/600',
    tags: ['React', 'Tailwind', 'Framer Motion'],
    github: 'https://github.com',
    demo: 'https://example.com',
    category: 'Web Design',
  },
  {
    id: '2',
    title: 'AI Content Generator',
    description: '利用 Google Gemini API 构建的内容生成工具，支持多种写作风格与格式。',
    image: 'https://picsum.photos/seed/project2/800/600',
    tags: ['Next.js', 'Gemini API', 'TypeScript'],
    github: 'https://github.com',
    demo: 'https://example.com',
    category: 'AI Tool',
  },
  {
    id: '3',
    title: 'Crypto Dashboard',
    description: '实时追踪加密货币价格与趋势的可视化仪表盘，集成多种 API 数据源。',
    image: 'https://picsum.photos/seed/project3/800/600',
    tags: ['React', 'D3.js', 'Recharts'],
    github: 'https://github.com',
    category: 'Data Viz',
  },
  {
    id: '4',
    title: 'Task Management System',
    description: '高效的团队协作与任务管理系统，支持看板视图与实时同步。',
    image: 'https://picsum.photos/seed/project4/800/600',
    tags: ['React', 'Firebase', 'Tailwind'],
    demo: 'https://example.com',
    category: 'SaaS',
  },
];

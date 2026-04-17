import { resolveRuntimeH3Path } from './build/utils/resolve-runtime-h3-path';
import { resolveSessionPasswordRuntimeValue } from './shared/utils/session-password';

const runtimeH3Path = resolveRuntimeH3Path();

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  alias: {
    h3: runtimeH3Path,
  },
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  modules: ['@nuxt/ui', 'nuxt-auth-utils'],
  runtimeConfig: {
    session: {
      password: resolveSessionPasswordRuntimeValue(),
    },
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@127.0.0.1:3306/nuxt-blog',
    mediaStorageDir: process.env.MEDIA_STORAGE_DIR || 'storage/media',
    securityHashSalt: process.env.SECURITY_HASH_SALT || '',
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
    public: {},
  },
  routeRules: {
    '/admin/**': { ssr: false },
  },
  app: {
    head: {
      title: 'TechFlow',
      meta: [
        {
          name: 'description',
          content: '探索技术边界，分享开发心得。',
        },
      ],
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Serif+SC:wght@600;700;900&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },
  colorMode: {
    classSuffix: '',
    fallback: 'light',
    preference: 'system',
    storageKey: 'theme',
  },
  auth: {
    hash: {
      scrypt: {},
    },
  },
  vite: {
    resolve: {
      alias: {
        h3: runtimeH3Path,
      },
    },
    optimizeDeps: {
      include: [
        'lucide-vue-next',
        'markdown-it',
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor',
        '@nuxt/ui > prosemirror-tables',
        '@tiptap/extension-image',
        '@tiptap/extension-text-align',
      ],
    },
    server: {
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  },
});

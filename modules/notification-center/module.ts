import { addServerPlugin, createResolver, defineNuxtModule } from 'nuxt/kit';

export default defineNuxtModule({
  meta: {
    name: 'notification-center',
  },
  setup() {
    const { resolve } = createResolver(import.meta.url);
    addServerPlugin(resolve('./runtime/plugin'));
  },
});

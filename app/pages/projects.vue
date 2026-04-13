<template>
  <main class="flex-grow pt-32 pb-20">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-2 hidden lg:block">
          <LeftSidebar />
        </div>

        <div class="lg:col-span-8 space-y-12">
          <header class="mb-16">
            <div class="relative inline-block">
              <h1 class="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white mb-4 font-serif tracking-tighter">Projects<span class="text-brand-600">.</span></h1>
              <div class="absolute -bottom-2 left-0 w-24 h-2 bg-brand-600 rounded-full" />
            </div>
            <p class="mt-8 text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-sans">
              这里展示部分个人项目与实验作品，每一个都对应一段技术探索过程。
            </p>
          </header>

          <div class="space-y-3">
            <h2 class="text-sm font-black uppercase tracking-[0.28em] text-slate-400">{{ page.projectsSection.title }}</h2>
            <div class="h-px bg-slate-100 dark:bg-slate-800" />
          </div>

          <div v-if="enabledProjects.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <div
              v-for="project in enabledProjects"
              :key="project.id"
              class="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all duration-500"
            >
              <div class="relative h-44 overflow-hidden">
                <img
                  :src="project.image"
                  :alt="project.title"
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerpolicy="no-referrer"
                />
                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
                <div class="absolute top-3 left-3">
                  <span
                    class="px-2 py-0.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[9px] font-black uppercase tracking-widest rounded-full text-brand-600 border border-white/20"
                  >
                    {{ project.category }}
                  </span>
                </div>
              </div>

              <div class="p-6 flex-grow flex flex-col">
                <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2 font-serif group-hover:text-brand-600 transition-colors">
                  {{ project.title }}
                </h3>
                <p class="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-4 flex-grow line-clamp-2">
                  {{ project.description }}
                </p>

                <div class="flex flex-wrap gap-1.5 mb-6">
                  <span
                    v-for="tag in project.tags"
                    :key="tag"
                    class="px-2 py-0.5 bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[9px] font-bold rounded-md border border-slate-100 dark:border-slate-800"
                  >
                    {{ tag }}
                  </span>
                </div>

                <div class="flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <a
                    v-if="project.githubUrl"
                    :href="project.githubUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Github :size="14" />
                    Source
                  </a>
                  <a
                    v-if="project.demoUrl"
                    :href="project.demoUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-brand-600 transition-colors"
                  >
                    <ExternalLink :size="14" />
                    Demo
                  </a>
                </div>
              </div>
            </div>
          </div>

          <section
            v-else
            class="rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 class="text-2xl font-black text-slate-900 dark:text-white font-serif">{{ page.emptyState.title }}</h2>
            <p class="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ page.emptyState.description }}
            </p>
          </section>
        </div>

        <div class="lg:col-span-2 hidden lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ExternalLink, Github } from 'lucide-vue-next';

const { settings, fetchSiteSettings } = useSiteSettings();
const { pageSettings, fetchPageSettings } = usePageSettings();

await Promise.all([
  fetchPageSettings(),
  fetchSiteSettings(),
]);

if (!pageSettings.value.projects.enabled) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const page = computed(() => pageSettings.value.projects);

useSitePageTitle(() => page.value.seo.title || '项目展示');

useSeoMeta({
  description: () => page.value.seo.description || settings.value.site.description,
});

const enabledProjects = computed(() =>
  page.value.projects.filter((item) => item.enabled)
);
</script>

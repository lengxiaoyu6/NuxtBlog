<template>
  <main class="flex-grow pt-32 pb-20">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-2 hidden lg:block">
          <LeftSidebar />
        </div>

        <div class="lg:col-span-8 space-y-12">
          <header class="mb-16 about-fade-up">
            <div class="relative inline-block">
              <h1 class="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white mb-4 font-serif tracking-tighter">About Me<span class="text-brand-600">.</span></h1>
              <div class="absolute -bottom-2 left-0 w-24 h-2 bg-brand-600 rounded-full" />
            </div>
          </header>

          <div class="space-y-16">
            <section class="space-y-8 about-fade-up about-delay-1">
              <div class="flex items-center gap-4">
                <h3 class="text-2xl font-black text-slate-900 dark:text-white font-serif shrink-0">
                  {{ page.intro.heading }}
                </h3>
                <div class="h-px flex-grow bg-slate-100 dark:bg-slate-800" />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                <div
                  v-for="(column, columnIndex) in introColumns"
                  :key="`intro-column-${columnIndex}`"
                  class="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-loose text-lg"
                >
                  <p v-for="paragraph in column" :key="paragraph">
                    {{ paragraph }}
                  </p>
                  <div class="pt-4 flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                    <MapPin :size="16" class="text-brand-600" />
                    {{ locationText }}
                  </div>
                </div>
              </div>
            </section>

            <section v-if="page.skillsSection.enabled" class="space-y-12 about-fade-up about-delay-2">
              <div class="flex items-center gap-4">
                <h3 class="text-3xl font-black text-slate-900 dark:text-white font-serif shrink-0 italic">
                  {{ page.skillsSection.heading }}
                </h3>
                <div class="h-px flex-grow bg-slate-200 dark:bg-slate-800" />
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <article
                  v-for="(stack, index) in techStacks"
                  :key="stack.title"
                  class="group relative p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden stack-card"
                  :style="{ animationDelay: `${0.12 * index}s` }"
                >
                  <div
                    class="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-700"
                    :class="stack.bgColor"
                  />
                  <div
                    class="absolute -left-16 -bottom-16 w-48 h-48 rounded-full blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-700"
                    :class="stack.bgColor"
                  />

                  <div class="relative z-10 space-y-10">
                    <div class="flex items-start justify-between gap-6">
                      <div class="space-y-2">
                        <div class="flex items-center gap-3">
                          <div class="p-3 rounded-xl" :class="[stack.bgColor, stack.color]">
                            <component :is="stack.icon" :size="24" />
                          </div>
                          <span class="text-xs font-black uppercase tracking-[0.2em]" :class="stack.color">
                            {{ stack.subtitle }}
                          </span>
                        </div>
                        <h4 class="text-3xl font-black text-slate-900 dark:text-white font-serif">
                          {{ stack.title }}
                        </h4>
                      </div>

                      <div class="flex flex-col items-end shrink-0">
                        <span class="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                      {{ stack.level }}%
                        </span>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Mastery
                        </span>
                      </div>
                    </div>

                    <p class="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                      {{ stack.description }}
                    </p>

                    <div class="grid grid-cols-1 gap-6">
                      <div v-for="skill in stack.skills" :key="skill.name" class="space-y-3">
                        <div class="flex justify-between items-end gap-3">
                          <div class="flex items-center gap-2">
                            <div class="w-1.5 h-1.5 rounded-full" :class="skill.color" />
                            <span class="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {{ skill.name }}
                            </span>
                          </div>
                          <span class="text-[10px] font-mono text-slate-400">{{ skill.level }}%</span>
                        </div>

                        <div class="h-2 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full p-0.5">
                          <div
                            class="h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.08)] relative overflow-hidden skill-bar"
                            :class="skill.color"
                            :style="{ width: `${skill.level}%` }"
                          >
                            <div class="absolute inset-0 bg-white/20 skill-bar-glow" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </div>

        <div class="lg:col-span-2 hidden lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import {
  MapPin,
  Layout,
  Sparkles,
  SunMedium,
  Zap,
} from 'lucide-vue-next';

const { pageSettings, fetchPageSettings } = usePageSettings();
const { settings, fetchSiteSettings } = useSiteSettings();

await Promise.all([
  fetchPageSettings(),
  fetchSiteSettings(),
]);

if (!pageSettings.value.about.enabled) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const page = computed(() => pageSettings.value.about);

useSitePageTitle(() => page.value.seo.title || '关于我');

useSeoMeta({
  description: () => page.value.seo.description || settings.value.site.description,
});

const defaultOwnerLocationText = 'Shanghai, China · Based in Earth';
const locationText = computed(() => {
  const location = settings.value.owner.location.trim();
  const tagline = settings.value.owner.tagline.trim();
  const prefix = page.value.location.label.trim();
  const details = location && tagline ? `${location} · ${tagline}` : defaultOwnerLocationText;

  if (prefix) {
    return `${prefix} · ${details}`;
  }

  return details;
});

const introColumns = computed(() => {
  const paragraphs = page.value.intro.paragraphs.filter((item) => item.trim());
  const midpoint = Math.ceil(paragraphs.length / 2);

  return [
    paragraphs.slice(0, midpoint),
    paragraphs.slice(midpoint),
  ].filter((column) => column.length > 0);
});

const skillThemeMap = {
  blue: {
    icon: Layout,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    skillColors: ['bg-blue-500', 'bg-blue-400', 'bg-cyan-400', 'bg-indigo-500', 'bg-violet-500'],
  },
  emerald: {
    icon: Zap,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    skillColors: ['bg-emerald-500', 'bg-sky-500', 'bg-blue-600', 'bg-rose-500', 'bg-pink-500'],
  },
  violet: {
    icon: Sparkles,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    skillColors: ['bg-violet-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-indigo-500', 'bg-sky-500'],
  },
  amber: {
    icon: SunMedium,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    skillColors: ['bg-amber-500', 'bg-orange-500', 'bg-yellow-500', 'bg-red-400', 'bg-lime-500'],
  },
} as const;

const techStacks = computed(() =>
  page.value.skills.map((stack) => {
    const theme = skillThemeMap[stack.theme];

    return {
      ...stack,
      icon: theme.icon,
      color: theme.color,
      bgColor: theme.bgColor,
      skills: stack.items.map((skill, index) => ({
        ...skill,
        color: theme.skillColors[index % theme.skillColors.length],
      })),
    };
  })
);
</script>

<style scoped>
.about-fade-up {
  animation: about-fade-up 0.7s ease both;
}

.about-delay-1 {
  animation-delay: 0.08s;
}

.about-delay-2 {
  animation-delay: 0.16s;
}

.about-delay-3 {
  animation-delay: 0.24s;
}

.stack-card {
  animation: stack-scale-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.skill-bar {
  animation: skill-grow 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-origin: left center;
}

.skill-bar-glow {
  animation: skill-pulse 2.4s ease-in-out infinite;
}

@keyframes about-fade-up {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes stack-scale-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes skill-grow {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}

@keyframes skill-pulse {
  0%,
  100% {
    opacity: 0.2;
  }

  50% {
    opacity: 0.45;
  }
}
</style>

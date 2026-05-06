<template>
  <div class="admin-theme-shell relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
    <div class="pointer-events-none absolute inset-0 bg-noise" />

    <div
      class="relative mx-auto flex min-h-[calc(100vh-4rem)] items-center"
      :class="loginOnly ? 'max-w-lg' : 'max-w-6xl'"
    >
      <div
        class="grid w-full gap-8"
        :class="loginOnly ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_30rem]'"
      >
        <section
          v-if="!loginOnly"
          class="hidden min-h-[42rem] flex-col justify-between rounded-[2.5rem] border border-white/60 bg-white/50 p-8 shadow-2xl shadow-sky-950/10 backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-950/40 xl:flex"
        >
          <div class="space-y-6">
            <div class="grid size-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
              <UIcon :name="icon" class="size-7" />
            </div>

            <div class="space-y-3">
              <p class="text-sm font-bold uppercase tracking-[0.28em] text-brand-700 dark:text-brand-300">
                {{ eyebrow }}
              </p>
              <h1 class="max-w-lg font-serif text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                {{ title }}
              </h1>
              <p class="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                {{ description }}
              </p>
            </div>
          </div>

          <div class="grid gap-4">
            <article class="admin-theme-card rounded-[1.75rem] p-5">
              <div class="flex items-start gap-3">
                <div class="grid size-10 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
                  <UIcon name="i-lucide-layout-dashboard" class="size-5" />
                </div>
                <div class="space-y-1">
                  <h2 class="text-sm font-black text-slate-950 dark:text-white">模板化后台视觉</h2>
                  <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">与 `blog-admin-ui-template/` 保持同系背景、品牌色与响应式壳层。</p>
                </div>
              </div>
            </article>

            <article class="admin-theme-card rounded-[1.75rem] p-5">
              <div class="flex items-start gap-3">
                <div class="grid size-10 place-items-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300">
                  <UIcon name="i-lucide-smartphone" class="size-5" />
                </div>
                <div class="space-y-1">
                  <h2 class="text-sm font-black text-slate-950 dark:text-white">响应式访问</h2>
                  <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">登录、改密与后续后台页面在手机、平板与桌面端保持一致视觉语言。</p>
                </div>
              </div>
            </article>

            <article class="admin-theme-card rounded-[1.75rem] p-5">
              <div class="flex items-start gap-3">
                <div class="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <UIcon name="i-lucide-shield-check" class="size-5" />
                </div>
                <div class="space-y-1">
                  <h2 class="text-sm font-black text-slate-950 dark:text-white">保留现有鉴权能力</h2>
                  <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">当前登录、首次改密、人机校验与会话重定向逻辑继续复用原有实现。</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="mx-auto w-full max-w-xl" :class="loginOnly ? 'xl:max-w-xl' : 'xl:max-w-none'">
          <div
            class="admin-theme-card overflow-hidden rounded-[2.25rem]"
            :class="loginOnly ? 'p-8 sm:p-10' : 'p-6 sm:p-8'"
          >
            <div
              class="mb-6 pb-6"
              :class="loginOnly ? 'border-transparent text-center' : 'space-y-4 border-b border-white/60 dark:border-slate-800/70'"
            >
              <div
                v-if="!loginOnly"
                class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-200"
              >
                <UIcon :name="icon" class="size-4" />
                {{ eyebrow }}
              </div>

              <div
                v-if="loginOnly"
                class="mx-auto mb-5 grid size-16 place-items-center rounded-[1.5rem] bg-brand-600 text-white shadow-xl shadow-brand-500/30"
              >
                <UIcon :name="icon" class="size-8" />
              </div>

              <div class="space-y-2">
                <h2 class="font-serif text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  {{ title }}
                </h2>
                <p v-if="!loginOnly" class="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {{ description }}
                </p>
              </div>
            </div>

            <slot />

            <div v-if="!loginOnly" class="mt-6 border-t border-white/60 pt-6 dark:border-slate-800/70">
              <UButton to="/" color="neutral" variant="ghost" icon="i-lucide-arrow-left" block>
                返回博客首页
              </UButton>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: string;
  loginOnly?: boolean;
}>(), {
  description: '',
  eyebrow: '后台安全区域',
  icon: 'i-lucide-feather',
  loginOnly: false,
});
</script>

<template>
  <div class="min-h-screen flex flex-col relative mesh-gradient overflow-hidden">
    <div class="fixed inset-0 pointer-events-none z-0">
      <div class="absolute inset-0 bg-noise" />
      <div
        class="absolute top-1/4 -left-20 text-[20vw] font-black text-slate-900/5 dark:text-white/5 select-none font-serif rotate-90 lg:rotate-0"
      >
        TECHFLOW
      </div>
      <div
        class="absolute bottom-1/4 -right-20 text-[20vw] font-black text-slate-900/5 dark:text-white/5 select-none font-serif -rotate-90 lg:rotate-0"
      >
        JOURNAL
      </div>
      <div
        class="absolute top-40 right-10 w-96 h-96 border border-slate-200/50 dark:border-slate-800/50 rounded-full opacity-20"
      />
      <div
        class="absolute bottom-40 left-10 w-64 h-64 border border-slate-200/50 dark:border-slate-800/50 rounded-full opacity-20"
      />
    </div>

    <AppNavbar />
    <SearchDialog />
    <BackToTop />
    
    <main class="flex-grow relative z-10">
      <slot />
    </main>

    <AppFooter />

    <Transition name="fade">
      <LoadingScreen v-if="isLoading" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { fetchSiteSettings } = useSiteSettings();
const { fetchPageSettings } = usePageSettings();

await Promise.all([
  fetchSiteSettings(),
  fetchPageSettings(),
]);

const isLoading = ref(true);

onMounted(() => {
  window.setTimeout(() => {
    isLoading.value = false;
  }, 1500);
});
</script>

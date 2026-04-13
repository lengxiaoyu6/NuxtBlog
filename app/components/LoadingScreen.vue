<template>
  <div
    class="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center"
  >
    <div class="relative mb-8">
      <div
        class="w-20 h-20 bg-slate-900 dark:bg-brand-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-slate-200 dark:shadow-none font-serif"
      >
        T
      </div>
      <div
        class="absolute -inset-4 border-2 border-slate-100 dark:border-brand-500/30 border-t-slate-900 dark:border-t-brand-500 rounded-full animate-spin"
      />
    </div>

    <div class="text-center">
      <h2 class="text-slate-900 dark:text-white text-xl font-bold tracking-widest mb-2 font-serif">
        TECHFLOW.BLOG
      </h2>
      <div class="w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div class="h-full bg-slate-900 dark:bg-brand-500 loading-bar" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-bar {
  width: 40%;
  animation: loading-scan 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes loading-scan {
  0% {
    transform: translateX(-150%);
  }
  100% {
    transform: translateX(250%);
  }
}
</style>

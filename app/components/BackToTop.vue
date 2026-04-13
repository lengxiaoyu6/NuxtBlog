<template>
  <Transition name="fade-scale">
    <button
      v-if="show"
      type="button"
      @click="scrollToTop"
      class="fixed bottom-8 right-8 z-40 w-12 h-12 glass rounded-2xl flex items-center justify-center text-slate-500 hover:text-brand-600 hover:scale-110 active:scale-95 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none group"
      aria-label="返回顶部"
    >
      <div class="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/5 rounded-2xl transition-colors" />
      <ArrowUp :size="24" class="relative z-10" />
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { ArrowUp } from 'lucide-vue-next';

const show = ref(false);

const handleScroll = () => {
  show.value = window.scrollY > 400;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.5) translateY(20px);
}
</style>

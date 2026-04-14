<template>
  <div
    class="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group paper-texture"
  >
    <div class="absolute -right-4 -top-4 text-slate-50 dark:text-slate-800/50 group-hover:text-brand-50 dark:group-hover:text-brand-900/10 transition-colors">
      <Quote :size="80" />
    </div>

    <div class="relative z-10">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2 text-[10px] font-bold text-brand-600 uppercase tracking-widest font-serif">
          <span class="w-2 h-2 bg-brand-600 rounded-full animate-pulse" />
          一言 · Hitokoto
        </div>
        <button
          type="button"
          @click="fetchHitokoto"
          :disabled="loading"
          class="text-slate-300 hover:text-brand-600 transition-colors disabled:opacity-50 hover:bg-brand-50 dark:hover:bg-brand-900/30 p-1 rounded-md"
          title="换一句"
          aria-label="刷新一言"
        >
          <RefreshCw :size="14" :class="loading ? 'animate-spin' : ''" />
        </button>
      </div>

      <div class="min-h-[3rem] flex flex-col justify-center">
        <template v-if="loading">
          <div class="space-y-2">
            <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4 animate-pulse" />
            <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
          </div>
        </template>
        <template v-else>
          <p class="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed italic mb-2 font-serif">
            「 {{ data?.hitokoto || '保持热爱，奔赴山海。' }} 」
          </p>
          <div class="text-right text-[11px] text-slate-400">
            —— {{ fromText }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Quote, RefreshCw } from 'lucide-vue-next';

interface HitokotoData {
  hitokoto: string;
  from: string;
  from_who: string | null;
}

const data = ref<HitokotoData | null>(null);
const loading = ref(true);

const fromText = computed(() => {
  if (!data.value) {
    return 'TechFlow';
  }
  return data.value.from_who
    ? `${data.value.from_who} · 《${data.value.from}》`
    : `《${data.value.from}》`;
});

async function fetchHitokoto() {
  loading.value = true;
  try {
    const result = await $fetch<HitokotoData>('https://v1.hitokoto.cn/');
    data.value = result;
  } catch {
    data.value = {
      hitokoto: '代码写到最后，拼的是耐心与边界感。',
      from: 'TechFlow',
      from_who: null,
    };
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchHitokoto();
});
</script>

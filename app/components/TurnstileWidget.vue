<template>
  <div v-if="enabled" class="space-y-2">
    <div
      ref="containerRef"
      class="min-h-[66px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50"
    />
    <p
      v-if="statusMessage"
      class="text-xs"
      :class="statusTone === 'error' ? 'text-rose-500 dark:text-rose-300' : 'text-slate-400 dark:text-slate-500'"
    >
      {{ statusMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
type TurnstileRenderOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
};

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove?: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScriptPromise: Promise<void> | null = null;

function ensureTurnstileScript() {
  if (!import.meta.client) {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('turnstile-script-error')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = 'true';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('turnstile-script-error')), { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    turnstileScriptPromise = null;
    throw error;
  });

  return turnstileScriptPromise;
}

const props = withDefaults(defineProps<{
  enabled?: boolean;
  siteKey?: string;
  modelValue?: string;
  resetNonce?: number;
  theme?: 'light' | 'dark' | 'auto';
}>(), {
  enabled: false,
  siteKey: '',
  modelValue: '',
  resetNonce: 0,
  theme: 'auto',
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
  (event: 'error', value: string): void;
}>();

const colorMode = useColorMode();
const containerRef = ref<HTMLElement | null>(null);
const widgetId = ref<string | null>(null);
const statusMessage = ref('');
const statusTone = ref<'error' | 'info'>('info');

const resolvedTheme = computed(() => {
  if (props.theme !== 'auto') {
    return props.theme;
  }

  return colorMode.value === 'dark' ? 'dark' : 'light';
});

function resetState() {
  emit('update:modelValue', '');
}

function setError(message: string) {
  statusTone.value = 'error';
  statusMessage.value = message;
  emit('error', message);
}

function clearMessage() {
  statusTone.value = 'info';
  statusMessage.value = props.enabled ? '完成人机校验后即可提交。' : '';
}

function removeWidget() {
  if (!import.meta.client) {
    return;
  }

  if (widgetId.value && window.turnstile?.remove) {
    window.turnstile.remove(widgetId.value);
  }

  widgetId.value = null;
  if (containerRef.value) {
    containerRef.value.innerHTML = '';
  }
}

async function renderWidget() {
  if (!import.meta.client || !props.enabled) {
    removeWidget();
    return;
  }

  if (!props.siteKey.trim()) {
    removeWidget();
    setError('人机校验尚未完成配置。');
    return;
  }

  try {
    clearMessage();
    await ensureTurnstileScript();
    await nextTick();

    if (!containerRef.value || !window.turnstile) {
      setError('人机校验加载失败，请稍后重试。');
      return;
    }

    removeWidget();
    widgetId.value = window.turnstile.render(containerRef.value, {
      sitekey: props.siteKey.trim(),
      theme: resolvedTheme.value,
      callback(token) {
        clearMessage();
        emit('update:modelValue', token);
      },
      'expired-callback': () => {
        resetState();
        statusTone.value = 'info';
        statusMessage.value = '人机校验已失效，请重新完成校验。';
      },
      'error-callback': () => {
        resetState();
        setError('人机校验加载失败，请稍后重试。');
      },
    });
  }
  catch {
    setError('人机校验加载失败，请稍后重试。');
  }
}

watch(
  () => [props.enabled, props.siteKey, resolvedTheme.value] as const,
  async () => {
    resetState();
    await renderWidget();
  },
  { immediate: true },
);

watch(
  () => props.resetNonce,
  () => {
    resetState();

    if (widgetId.value && window.turnstile) {
      clearMessage();
      window.turnstile.reset(widgetId.value);
      return;
    }

    void renderWidget();
  },
);

onBeforeUnmount(() => {
  removeWidget();
});
</script>

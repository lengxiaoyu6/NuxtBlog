<template>
  <footer
    class="border-t border-slate-100 bg-white/50 py-12 backdrop-blur-sm dark:border-slate-900/50 dark:bg-slate-950/50"
  >
    <div class="mx-auto max-w-6xl px-4 text-center">
      <p class="font-serif text-sm text-slate-500 dark:text-slate-500">
        {{ settings.footer.copyright }}
      </p>
      <div class="mt-3">
        <a
          :href="settings.footer.icpLink"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-slate-400 transition-colors hover:text-brand-500 dark:text-slate-500"
        >
          {{ settings.footer.icpText }}
        </a>
      </div>
      <p v-if="settings.footer.note" class="mt-3 text-xs text-slate-400 dark:text-slate-500">
        {{ settings.footer.note }}
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useSiteSettings } from '~/composables/useSiteSettings';

const { settings } = useSiteSettings();
</script>

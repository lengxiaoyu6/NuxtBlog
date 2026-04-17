import { defineConfig } from 'vitest/config';
import { resolveRuntimeH3Path } from './build/utils/resolve-runtime-h3-path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      h3: resolveRuntimeH3Path(),
    },
  },
});

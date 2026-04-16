import { defineConfig } from 'vitest/config';
import { resolveRuntimeH3Path } from './build/utils/resolve-runtime-h3-path';

export default defineConfig({
  resolve: {
    alias: {
      h3: resolveRuntimeH3Path(),
    },
  },
});

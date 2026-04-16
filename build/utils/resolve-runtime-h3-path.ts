import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

export function resolveRuntimeH3Path() {
  const nuxtPackageJsonPath = require.resolve('nuxt/package.json');
  const runtimeH3PackageJsonPath = require.resolve('h3/package.json', {
    paths: [dirname(nuxtPackageJsonPath)],
  });

  return join(dirname(runtimeH3PackageJsonPath), 'dist/index.mjs');
}

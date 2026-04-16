import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveRuntimeH3Path } from '../../build/utils/resolve-runtime-h3-path';

describe('runtime dependency compatibility', () => {
  it('does not declare a standalone h3 dependency that can diverge from Nuxt runtime', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
    ) as {
      dependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies?.h3).toBeUndefined();
  });

  it('resolves h3 helpers from the Nuxt runtime version used by Nitro', () => {
    expect(resolveRuntimeH3Path()).toMatch(/[/\\]h3@1\./);
  });
});

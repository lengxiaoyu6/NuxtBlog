import { describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = process.cwd();
const nuxtConfigUrl = pathToFileURL(path.resolve(projectRoot, 'nuxt.config.ts')).href;

vi.stubGlobal('defineNuxtConfig', (config: unknown) => config);

async function loadNuxtConfig() {
  vi.resetModules();
  const imported = await import(`${nuxtConfigUrl}?t=${Date.now()}`);
  return imported.default;
}

describe('nuxt color mode configuration', () => {
  it('在主题切换时临时关闭元素过渡动画，避免明暗主题切换出现闪烁', async () => {
    const config = await loadNuxtConfig();

    expect(config.colorMode?.disableTransition).toBe(true);
  });
});

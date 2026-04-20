import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('LoadingScreen site branding', () => {
  it('首屏加载态应复用站点设置中的标题与首字母标识', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/components/LoadingScreen.vue'), 'utf8');

    expect(source).toContain('useSiteSettings');
    expect(source).toMatch(/\{\{\s*(siteName|settings\.site\.name)\s*\}\}/);
    expect(source).toContain('{{ brandMark }}');
    expect(source).not.toContain('TECHFLOW.BLOG');
    expect(source).not.toMatch(/>\s*T\s*</);
  });
});

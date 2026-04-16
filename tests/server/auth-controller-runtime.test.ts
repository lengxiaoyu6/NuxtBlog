import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('auth controller runtime compatibility', () => {
  it('uses Nuxt runtime auto imports for request helpers', () => {
    const source = readFileSync(resolve(process.cwd(), 'server/controllers/auth.controller.ts'), 'utf8');

    expect(source).toMatch(/import type \{ H3Event \} from 'h3';/);
    expect(source).not.toMatch(/import\s*\{[^}]*readBody[^}]*\}\s*from 'h3';/);
    expect(source).not.toMatch(/import\s*\{[^}]*createError[^}]*\}\s*from 'h3';/);
  });
});

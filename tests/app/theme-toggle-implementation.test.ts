import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('theme toggle implementation', () => {
  it('avoids View Transition API during theme switching to prevent visible flashing', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/components/AppNavbar.vue'), 'utf8');

    expect(source).not.toMatch(/startViewTransition/);
    expect(source).not.toMatch(/::view-transition-(old|new)\(root\)/);
  });
});

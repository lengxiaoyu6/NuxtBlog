import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('SearchDialog modal ui override', () => {
  it('removes default modal visual styles from the outer content container', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/components/SearchDialog.vue'), 'utf8');

    expect(source).toContain(':ui="modalUi"');
    expect(source).toContain("content: 'overflow-visible bg-transparent shadow-none ring-0 rounded-none'");
  });
});

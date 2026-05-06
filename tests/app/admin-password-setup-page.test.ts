import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageSource = readFileSync('app/pages/admin/password-setup.vue', 'utf8');

describe('admin password setup page', () => {
  it('uses the compact auth shell without the left card content', () => {
    expect(pageSource).toContain('login-only');
  });

  it('refreshes the browser after login cookie is created for the first password setup page', () => {
    const loginSource = readFileSync('app/pages/admin/login.vue', 'utf8');

    expect(loginSource).toContain("navigateTo('/admin/password-setup', { external: true })");
  });
});

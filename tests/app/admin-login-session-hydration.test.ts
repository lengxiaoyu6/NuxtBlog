import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('admin login session hydration', () => {
  it('hydrates the client session from the login response before navigating to password setup', () => {
    const source = readSource('app/pages/admin/login.vue');

    expect(source).toContain('const { fetch: fetchUserSession, session: userSession } = useUserSession();');
    expect(source).toContain('hydrateUserSession(loginResult.user);');
    expect(source.indexOf('hydrateUserSession(loginResult.user);')).toBeLessThan(source.indexOf("await navigateTo('/admin/password-setup')"));
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('admin login password setup redirect', () => {
  it('uses the login response user to decide the first password setup redirect', () => {
    const source = readSource('app/pages/admin/login.vue');

    expect(source).toContain('const loginResult = await $fetch<{ ok: boolean; user: AdminSessionUser }>(\'/api/auth/login\'');
    expect(source).toContain('if (loginResult.user.mustChangePassword)');
    expect(source).not.toContain('const sessionUser = computed(() => userSession.value as AdminSessionUser | null | undefined);');
    expect(source).not.toContain('if (sessionUser.value?.mustChangePassword)');
  });
});

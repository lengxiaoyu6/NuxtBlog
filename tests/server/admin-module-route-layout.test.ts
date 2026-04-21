import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('admin module route layout', () => {
  it('keeps module-specific handlers inside the dynamic module branch to avoid shadowing module detail routes', () => {
    const staticModuleDirectory = resolve(process.cwd(), 'server/api/admin/modules/notification-center');
    const dynamicSettingsHandler = resolve(process.cwd(), 'server/api/admin/modules/[moduleKey]/settings.get.ts');
    const dynamicSettingsSaveHandler = resolve(process.cwd(), 'server/api/admin/modules/[moduleKey]/settings.put.ts');
    const dynamicTestHandler = resolve(process.cwd(), 'server/api/admin/modules/[moduleKey]/test.post.ts');

    expect(existsSync(staticModuleDirectory)).toBe(false);
    expect(existsSync(dynamicSettingsHandler)).toBe(true);
    expect(existsSync(dynamicSettingsSaveHandler)).toBe(true);
    expect(existsSync(dynamicTestHandler)).toBe(true);
  });
});

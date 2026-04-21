import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('admin settings notification migration', () => {
  it('removes notification fields and test email entry from the system settings page', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/pages/admin/settings.vue'), 'utf8');

    expect(source).not.toContain("'notification'");
    expect(source).not.toContain("activeTab === 'notification'");
    expect(source).not.toContain('savedSnapshot.notification');
    expect(source).not.toContain('form.notification');
    expect(source).not.toContain('/api/admin/settings/notification/test');
    expect(source).not.toContain('邮件通知');
    expect(source).not.toContain('测试发信');
  });
});

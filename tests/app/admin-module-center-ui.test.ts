import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('admin module center ui', () => {
  it('adds a module center entry to the admin navigation and matches module detail routes', () => {
    const layoutSource = readFileSync(resolve(process.cwd(), 'app/layouts/admin.vue'), 'utf8');
    const navSource = readFileSync(resolve(process.cwd(), 'app/constants/admin-navigation.ts'), 'utf8');

    expect(navSource).toContain("label: '模块插件'");
    expect(navSource).toContain("to: '/admin/modules'");
    expect(layoutSource).toContain("route.path.startsWith('/admin/modules/')");
  });

  it('provides module list and module detail pages for the notification module', () => {
    const listSource = readFileSync(resolve(process.cwd(), 'app/pages/admin/modules/index.vue'), 'utf8');
    const detailSource = readFileSync(resolve(process.cwd(), 'app/pages/admin/modules/[moduleKey].vue'), 'utf8');

    expect(listSource).toContain('/api/admin/modules');
    expect(listSource).toContain('模块插件');
    expect(listSource).toContain('notification-center');
    expect(listSource).toContain('grid gap-4 sm:grid-cols-2 xl:grid-cols-3');
    expect(listSource).toContain('UCard');
    expect(listSource).toContain('UButton');
    expect(listSource).toContain('UIcon');
    expect(listSource).toContain('flex flex-col gap-4');
    expect(listSource).toContain('flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between');
    expect(listSource).toContain('flex h-10 w-10 items-center justify-center rounded-xl');
    expect(listSource).toContain('i-lucide-package');
    expect(listSource).toContain('flex flex-wrap items-center gap-2');
    expect(listSource).toContain('px-2.5 py-1 text-[11px] font-bold text-slate-500');
    expect(listSource).toContain('grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-3 text-sm');

    expect(detailSource).toContain('/api/admin/modules/notification-center/settings');
    expect(detailSource).toContain('/api/admin/modules/notification-center/test');
    expect(detailSource).toContain('安装模块');
    expect(detailSource).toContain('启用模块');
    expect(detailSource).toContain('邮件通知');
  });
});

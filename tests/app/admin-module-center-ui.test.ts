import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('admin module center ui', () => {
  it('adds a module center entry to the admin navigation and matches module detail routes', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/layouts/admin.vue'), 'utf8');

    expect(source).toContain("label: '模块插件'");
    expect(source).toContain("path: '/admin/modules'");
    expect(source).toContain("route.path.startsWith('/admin/modules/')");
  });

  it('provides module list and module detail pages for the notification module', () => {
    const listSource = readFileSync(resolve(process.cwd(), 'app/pages/admin/modules/index.vue'), 'utf8');
    const detailSource = readFileSync(resolve(process.cwd(), 'app/pages/admin/modules/[moduleKey].vue'), 'utf8');

    expect(listSource).toContain('/api/admin/modules');
    expect(listSource).toContain('模块插件');
    expect(listSource).toContain('notification-center');
    expect(listSource).toContain('grid justify-items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3');
    expect(listSource).toContain('w-full max-w-[26rem] rounded-[1.5rem] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm');
    expect(listSource).toContain('flex flex-col gap-4');
    expect(listSource).toContain('flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between');
    expect(listSource).toContain('flex h-10 w-10 items-center justify-center rounded-xl');
    expect(listSource).toContain('<Package :size="18" />');
    expect(listSource).toContain('flex flex-wrap items-center gap-2');
    expect(listSource).toContain('px-2.5 py-1 text-[11px] font-bold text-slate-500');
    expect(listSource).not.toContain('rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500');
    expect(listSource).toContain('grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-3 text-sm');

    expect(detailSource).toContain('/api/admin/modules/notification-center/settings');
    expect(detailSource).toContain('/api/admin/modules/notification-center/test');
    expect(detailSource).toContain('安装模块');
    expect(detailSource).toContain('启用模块');
    expect(detailSource).toContain('邮件通知');
  });
});

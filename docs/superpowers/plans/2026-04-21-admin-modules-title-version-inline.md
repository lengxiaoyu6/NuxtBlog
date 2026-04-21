# 后台模块卡片标题与版本同行 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将后台模块插件列表页的版本标签并入标题行，同时保持安装状态与启用状态标签继续留在右侧状态区。

**Architecture:** 保持 `app/pages/admin/modules/index.vue` 的现有卡片结构，只调整模块图标旁边的标题信息块与右侧状态标签块。通过 `tests/app/admin-module-center-ui.test.ts` 固定新的标题排版类名与旧版本标签移除的约束，先让测试失败，再用最小改动让测试通过。

**Tech Stack:** Nuxt 3、Vue 3、Tailwind CSS、Vitest

---

### Task 1: 固定标题与版本同行的静态断言

**Files:**
Create: 无
Modify: `tests/app/admin-module-center-ui.test.ts`
Test: `tests/app/admin-module-center-ui.test.ts`

- [ ] **Step 1: 写失败测试**

在 `it('provides module list and module detail pages for the notification module', ...)` 中补充以下断言：

```ts
expect(listSource).toContain('flex flex-wrap items-center gap-2');
expect(listSource).toContain('px-2.5 py-1 text-[11px] font-bold text-slate-500');
expect(listSource).not.toContain('rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500');
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
pnpm vitest run tests/app/admin-module-center-ui.test.ts
```

Expected: FAIL，提示新标题结构断言尚未满足。

### Task 2: 调整标题与状态区域布局

**Files:**
Create: 无
Modify: `app/pages/admin/modules/index.vue`
Test: `tests/app/admin-module-center-ui.test.ts`

- [ ] **Step 1: 修改标题信息块**

将图标右侧标题区改为：

```vue
<div class="space-y-1">
  <div class="flex flex-wrap items-center gap-2">
    <h2 class="text-lg font-black text-slate-900 dark:text-white">{{ moduleItem.name }}</h2>
    <span class="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:text-slate-300">
      v{{ moduleItem.version }}
    </span>
  </div>
  <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{{ moduleItem.key }}</p>
</div>
```

- [ ] **Step 2: 移除右侧旧版本标签**

删除右侧状态区中的旧版本胶囊，仅保留安装状态与启用状态标签。

- [ ] **Step 3: 运行测试并确认通过**

Run:

```bash
pnpm vitest run tests/app/admin-module-center-ui.test.ts
```

Expected: PASS。

### Task 3: 运行关联验证与页面核验

**Files:**
Create: 无
Modify: 无
Test: `tests/app/admin-module-center-ui.test.ts`

- [ ] **Step 1: 运行模块中心相关测试**

Run:

```bash
pnpm vitest run tests/app/admin-module-center-ui.test.ts tests/app/notification-module-config.test.ts tests/server/admin-module-route-layout.test.ts
```

Expected: PASS。

- [ ] **Step 2: 刷新模块列表页核验标题视觉**

Run:

```bash
# 已启动开发服务时，在浏览器中刷新 /admin/modules 页面
```

Expected: 标题与版本位于同一行；右侧仅显示安装与启用状态；卡片宽度约束保持不变。

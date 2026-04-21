# 后台模块卡片紧凑化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 缩小后台模块插件列表页卡片占位，使大屏下单屏展示更多模块卡片，同时保持现有信息与交互行为。

**Architecture:** 保持 `app/pages/admin/modules/index.vue` 的现有结构，仅在模块列表区收缩栅格、卡片、图标与信息区样式。用 `tests/app/admin-module-center-ui.test.ts` 固定关键类名，先让测试失败，再用最小样式修改使其通过。

**Tech Stack:** Nuxt 3、Vue 3、Tailwind CSS、Vitest

---

### Task 1: 固定紧凑卡片的静态断言

**Files:**
Create: 无
Modify: `tests/app/admin-module-center-ui.test.ts`
Test: `tests/app/admin-module-center-ui.test.ts`

- [ ] **Step 1: 写失败测试**

在 `it('provides module list and module detail pages for the notification module', ...)` 中补充以下断言：

```ts
expect(listSource).toContain('grid justify-items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3');
expect(listSource).toContain('w-full max-w-[26rem] rounded-[1.5rem] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm');
expect(listSource).toContain('flex flex-col gap-4');
expect(listSource).toContain('flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between');
expect(listSource).toContain('flex h-10 w-10 items-center justify-center rounded-xl');
expect(listSource).toContain('<Package :size="18" />');
expect(listSource).toContain('grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-3 text-sm');
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
pnpm vitest run tests/app/admin-module-center-ui.test.ts
```

Expected: FAIL，提示新加入的紧凑类名断言尚未满足。

### Task 2: 实现模块卡片紧凑样式

**Files:**
Create: 无
Modify: `app/pages/admin/modules/index.vue`
Test: `tests/app/admin-module-center-ui.test.ts`

- [ ] **Step 1: 修改模块列表栅格与卡片容器**

将模块列表区与卡片外层改为：

```vue
<section v-else class="grid justify-items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3">
  <article
    v-for="moduleItem in modules"
    :key="moduleItem.key"
    class="w-full max-w-[26rem] rounded-[1.5rem] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
  >
```

- [ ] **Step 2: 修改卡片内部间距与头部图标**

将卡片主体与头部改为：

```vue
<div class="flex flex-col gap-4">
  <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div class="space-y-3">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300">
          <Package :size="18" />
        </div>
```

- [ ] **Step 3: 修改信息区间距**

将时间信息区改为：

```vue
<dl class="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/40 sm:grid-cols-2">
```

按钮区逻辑与按钮高度保持原样。

- [ ] **Step 4: 运行测试并确认通过**

Run:

```bash
pnpm vitest run tests/app/admin-module-center-ui.test.ts
```

Expected: PASS。

### Task 3: 运行关联验证

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

- [ ] **Step 2: 浏览器刷新模块列表页确认视觉结果**

Run:

```bash
# 已启动开发服务时，在浏览器中刷新 /admin/modules 页面
```

Expected: 模块卡片较之前更紧凑；模块数量较少时单卡宽度维持在更窄范围；中屏保持双列，大屏可展示更多卡片。

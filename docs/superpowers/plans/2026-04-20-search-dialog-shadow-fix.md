# 搜索弹层阴影修正 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除前台搜索弹层四角的直角阴影，同时保持现有尺寸、圆角、边框和配色表现不变。

**Architecture:** 保留 `SearchDialog` 内层视觉盒子，将 `UModal` 外层内容容器限制为定位和动画承载层。通过局部 `ui.content` 覆盖移除 `UModal` 默认的背景、阴影、描边与圆角，并将外层溢出方式改为可见，避免内层阴影在外层矩形边界处被裁切。

**Tech Stack:** Nuxt 4、Vue 3、@nuxt/ui、Vitest

---

### Task 1: 为搜索弹层添加样式回归保护并实施修正

**Files:**
Create: `tests/app/search-dialog-modal-ui.test.ts`

Modify: `app/components/SearchDialog.vue`

Test: `tests/app/search-dialog-modal-ui.test.ts`

- [ ] **Step 1: 编写失败中的回归测试**

```ts
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
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm test tests/app/search-dialog-modal-ui.test.ts`

Expected: 失败，提示未找到 `:ui="modalUi"` 或未找到外层内容容器的样式覆盖字符串。

- [ ] **Step 3: 在组件中添加最小实现**

```vue
<UModal v-model:open="isOpen" :ui="modalUi">
```

```ts
const modalUi = {
  content: 'overflow-visible bg-transparent shadow-none ring-0 rounded-none',
} as const;
```

要求：

覆盖 `UModal` 外层内容容器的视觉样式与溢出方式。

内层容器继续保留 `rounded-3xl shadow-xl border ...`。

搜索逻辑与现有交互保持不变。

- [ ] **Step 4: 重新运行测试并确认通过**

Run: `pnpm test tests/app/search-dialog-modal-ui.test.ts`

Expected: 通过，显示 1 个测试通过。

- [ ] **Step 5: 运行构建验证**

Run: `pnpm build`

Expected: 构建完成，退出码为 0。

- [ ] **Step 6: 浏览器核对视觉结果**

检查项：

打开首页搜索弹层。

确认弹层四角阴影与圆角一致。

确认亮色与暗色模式下未出现新的外层边框或方角阴影。

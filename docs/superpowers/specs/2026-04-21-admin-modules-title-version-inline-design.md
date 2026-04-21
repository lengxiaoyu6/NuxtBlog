# 后台模块卡片标题与版本同行设计

## 背景

后台模块插件列表页已经完成卡片收窄，但版本标签仍位于右侧状态区，模块名称与版本信息在视觉上分离。当前希望将版本并入标题区域，同一眼区内完成模块名称识别，同时保留右侧状态标签只表达安装状态与启用状态。

## 目标

调整 `app/pages/admin/modules/index.vue` 中模块卡片头部布局，并保持以下约束：

1. 模块名称与版本标签出现在同一行。
2. 模块键名仍保留在下一行，作为次级标识信息。
3. `已安装` 与 `已启用` 标签继续保留在右侧状态区。
4. 卡片宽度约束、描述区、时间信息区与操作按钮区保持现有行为。

## 方案

### 标题区域

标题文本容器改为两层结构：

1. 第一层使用 `flex flex-wrap items-center gap-2`，用于承载模块名称与版本标签。
2. 第二层继续展示 `moduleItem.key`，保留当前全大写样式。
3. 模块图标容器与标题区仍保持同一水平排列。

建议结构如下：

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

### 状态区域

右侧状态区域继续使用当前 `flex flex-wrap items-center gap-2` 结构，仅移除版本标签，使该区域只承载：

1. 安装状态标签。
2. 启用状态标签。

这样可保持标题区负责模块身份，右侧区域负责运行状态。

### 视觉影响

版本标签仍保持胶囊样式，但尺寸较当前略收紧，避免与主标题竞争视觉权重。由于卡片已有 `max-w-[26rem]` 限制，标题区使用 `flex-wrap` 后，小屏与极窄宽度下也能自然换行。

## 测试策略

先修改 `tests/app/admin-module-center-ui.test.ts`，增加对标题行结构与版本标签新位置的静态断言，再修改页面实现使测试通过。

断言范围包括：

1. 标题区包含 `flex flex-wrap items-center gap-2`。
2. 标题区版本标签包含 `px-2.5 py-1 text-[11px]`。
3. 右侧状态区仅保留安装状态与启用状态标签，不再包含旧版本胶囊类名 `border border-slate-200 px-3 py-1 text-xs`。

## 影响范围

仅涉及 `app/pages/admin/modules/index.vue` 的模块卡片头部结构与 `tests/app/admin-module-center-ui.test.ts` 的静态断言，不影响接口、状态修改逻辑与模块详情页。

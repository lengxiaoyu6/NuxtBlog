# 搜索弹层阴影修正设计

**目标**

修正前台搜索弹层四角出现直角阴影的问题，同时保持当前尺寸、圆角层级、边框和配色表现不变。

## 背景

前台搜索组件位于 `app/components/SearchDialog.vue`。当前实现中，`UModal` 默认内容容器与内部自定义内容容器同时承担视觉样式：

```vue
<UModal v-model:open="isOpen">
  <template #content>
    <div class="overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
```

运行时可观察到两层容器样式并存：

外层 `UModal` 默认内容容器保留 `rounded-lg shadow-lg ring ring-default bg-default`。

内层搜索盒子使用 `rounded-3xl shadow-xl border ...`。

外层与内层圆角半径不同，阴影又分别绘制在两层容器上，于是外层八像素圆角对应的阴影在四角露出直角轮廓，形成当前视觉问题。

## 设计目标

本次修改仅处理阴影与圆角不一致的问题，保持以下项目不变：

1. 搜索弹层的尺寸与定位方式。
2. 当前内层圆角大小。
3. 当前边框、背景与暗色模式表现。
4. 搜索交互、快捷键与结果列表结构。

## 方案比较

### 方案一

保留当前内层视觉盒子，移除 `UModal` 外层内容容器的背景、阴影、描边与圆角，并将外层溢出方式改为可见，仅让外层承担定位、尺寸和动画职责。

优点是修改范围最小，现有结构几乎无需调整，视觉保持最稳定。适合作为本次处理方案。

### 方案二

将圆角和阴影迁移到 `UModal` 外层，内层改为纯内容容器。

这种方式可以减少视觉容器层级，但需要重新整理内容包裹层，样式迁移较多，超出本次问题所需调整范围。

### 方案三

保留双层视觉容器，同时让外层与内层使用相同的圆角和阴影参数。

这种方式能够缓解当前现象，但双层同时负责视觉表现，后续维护时仍然容易再次出现偏差。

## 采用方案

采用方案一。

在 `SearchDialog.vue` 中为 `UModal` 传入 `ui` 覆盖，清空外层内容容器默认的背景、阴影、描边与圆角样式，并将外层溢出方式调整为 `overflow-visible`，避免内层圆角阴影被外层矩形边界裁切。内层容器继续保留现有 `rounded-3xl shadow-xl border ...` 类名，作为唯一的视觉盒子。

建议覆盖内容容器的视觉样式，使其等价于：

```ts
ui: {
  content: 'overflow-visible bg-transparent shadow-none ring-0 rounded-none'
}
```

具体拼接方式以 Nuxt UI 组件的 `ui.content` 合并规则为准，目标是覆盖外层视觉样式与溢出方式，同时保留默认布局类名。

## 影响范围

修改文件仅涉及：

`app/components/SearchDialog.vue`

本次修改不涉及其他 `UModal` 使用位置，也不调整全局 `ui.modal` 主题配置，避免影响确认框等其他弹层组件。

## 验证

需要完成以下检查：

1. 打开前台搜索弹层，确认阴影与圆角轮廓一致，四角无额外直角阴影。
2. 检查亮色与暗色模式下弹层外观保持一致。
3. 执行 `pnpm build`，确认构建通过。

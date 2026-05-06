# 后台项目列表卡片化设计

## 背景

管理员后台的项目管理页位于 `app/pages/admin/pages/projects.vue`。当前 `projects` 标签页已经切换为卡片网格，但每张卡片内部仍展开完整编辑表单，占用较多垂直空间，列表浏览效率偏低。

本次调整继续限定在后台项目管理页的“项目列表”编辑界面。前台项目展示页 `app/pages/projects.vue`、项目数据结构、保存接口与校验逻辑继续保持现状。

## 目标

将后台项目列表调整为“摘要卡片 + 弹窗编辑”结构，使列表浏览更紧凑，同时保留当前页面的保存、校验与项目增删能力。

本次调整完成后应满足以下条件：

1. `projects` 标签页中的项目条目继续以响应式卡片网格展示。
2. 卡片仅展示高频摘要信息与常用操作，完整字段改为在弹窗内编辑。
3. `form.projects`、`projectTags`、`addProject`、`removeProject`、`syncProjectTags`、`validateForm`、`savePageSettings`、`resetForm` 继续生效。
4. 手机、平板、桌面端均具备良好的自适应表现。

## 范围

### 包含内容

1. 调整 `app/components/admin/pages/AdminProjectEditorCard.vue` 为摘要卡片。
2. 调整 `app/pages/admin/pages/projects.vue`，新增项目编辑弹窗与编辑状态管理。
3. 复用现有项目表单字段，在弹窗中承载完整编辑表单。
4. 更新静态测试，约束项目列表采用卡片摘要结构与弹窗编辑结构。
5. 同步更新本事项规格与计划文档。

### 保持现状的内容

1. 前台项目展示页 `app/pages/projects.vue`。
2. `ProjectsPageSettings` 与 `ManagedProjectItem` 类型定义。
3. 页面设置接口与服务端持久化结构。
4. 页面顶部状态、SEO、空状态设置区。

## 方案对比

### 方案一

卡片仅显示标题和编辑按钮，启用状态与删除操作一并放到弹窗中。

优点：卡片最紧凑。  
代价：常用状态切换与删除操作需要多一步进入弹窗。

### 方案二

卡片保留标题、分类、启用开关、编辑按钮、删除按钮，完整字段放到弹窗中。

优点：列表浏览紧凑，同时保留高频操作入口；编辑详情与快速状态调整职责清晰。  
代价：卡片头部信息与按钮数量略多，但仍明显小于完整表单卡片。

### 方案三

继续使用完整表单卡片，仅通过折叠区隐藏次要字段。

优点：保留原有卡片结构。  
代价：组件仍承担大量输入控件，列表高度改善有限，移动端阅读负担仍较重。

## 采用方案

采用方案二。

页面层保留“项目区块标题”“新增项目”“保存与重置”等页面级职责。单项目卡片仅展示摘要信息与高频操作，通过“编辑”按钮打开弹窗，在弹窗内维护完整字段表单。

## 界面结构

### 页面层

`projects` 标签页继续展示：

1. 项目列表标题与说明。
2. “新增项目”按钮。
3. 项目区块标题输入框。
4. 项目卡片响应式网格。
5. 项目编辑弹窗。

项目条目区域继续采用两列主布局，例如 `xl:grid-cols-2`，保证卡片宽度适中。

### 卡片层

每张项目卡片展示以下结构：

#### 卡片头部

1. 项目标题，标题为空时显示“未命名项目”。
2. 项目分类副标题。
3. 状态徽标。
4. 删除按钮。

#### 卡片主体

1. 封面预览图或占位图。
2. 简短描述摘要，限制为两到三行。
3. 标签数量与链接数量摘要。

#### 卡片脚部操作区

1. 启用状态开关。
2. “编辑”按钮，用于打开弹窗。
3. 链接可用性提示，例如“已配置源码”“已配置演示”。

### 弹窗层

弹窗使用当前项目已经采用的 `UModal` 结构，内容区承载完整项目表单。

弹窗内包含以下字段：

1. 项目标题。
2. 项目分类。
3. 项目描述。
4. 标签输入框，继续使用逗号分隔字符串与 `projectTags` 同步。
5. 封面图片链接。
6. GitHub 链接。
7. 演示链接。
8. 启用状态开关。
9. 删除按钮。

弹窗头部显示当前编辑项目名称；项目标题为空时显示“未命名项目”。

## 组件拆分

继续使用组件：

`app/components/admin/pages/AdminProjectEditorCard.vue`

职责：

1. 接收单个项目对象。
2. 渲染摘要卡片布局。
3. 通过事件向页面层回传编辑与删除操作。
4. 保留启用状态的快速切换。

建议属性与事件：

### Props

1. `project`
2. `tagsValue`

### Emits

1. `edit`
2. `remove`

`tagsValue` 虽然不再用于卡片内输入，但仍可用于展示标签数量，避免在卡片上依赖尚未同步的 `project.tags`。

页面层继续直接持有 `form.projects` 数据源。弹窗中的输入框继续通过 `v-model` 修改当前编辑项目对象字段。

## 数据与行为

### 保持现状

以下逻辑继续保留在 `app/pages/admin/pages/projects.vue`：

1. `addProject`
2. `removeProject`
3. `syncProjectTags`
4. `validateForm`
5. `savePageSettings`
6. `resetForm`

### 需要新增的页面状态

1. `isProjectEditorOpen`，控制弹窗开关。
2. `editingProjectId` 或等价状态，用于定位当前编辑项目。
3. `editingProject` 计算属性，用于取出当前编辑项目对象。
4. `openProjectEditor(id)` 与 `closeProjectEditor()` 方法。

### 新增与删除行为

1. `addProject` 创建项目后可立即打开该项目弹窗，便于连续录入。
2. `removeProject` 如果删除的是当前编辑项目，需要同步关闭弹窗并清空编辑状态。
3. 标签同步继续调用 `syncProjectTags(id)`，在弹窗输入框 `change` 事件中触发。

## 响应式设计

1. 卡片保持 `admin-theme-card` 风格与当前后台主题统一。
2. 卡片内图片区保持固定高度，避免网格抖动。
3. 弹窗内容区在移动端使用单列，在较宽屏幕下可以将链接字段组织为双列。
4. 弹窗宽度控制在中大型范围，例如 `max-w-4xl`，兼顾桌面与平板。

## 测试策略

采用测试先行方式。

### 测试文件

继续在 `tests/app/admin-ui-refactor.test.ts` 中补充静态断言。

### 断言方向

1. `app/pages/admin/pages/projects.vue` 包含 `UModal`、编辑状态、编辑方法与弹窗字段结构。
2. 页面继续包含项目卡片网格与 `AdminProjectEditorCard` 引用。
3. `AdminProjectEditorCard.vue` 仅保留摘要卡片结构，包含 `edit` 事件与编辑按钮。
4. 卡片组件中原完整字段输入结构不再出现。

### 回归范围

至少执行：

```bash
pnpm vitest run tests/app/admin-ui-refactor.test.ts
pnpm vitest run tests/app/admin-module-center-ui.test.ts
```

## 影响文件

### 修改

1. `app/pages/admin/pages/projects.vue`
2. `app/components/admin/pages/AdminProjectEditorCard.vue`
3. `tests/app/admin-ui-refactor.test.ts`
4. `docs/superpowers/specs/2026-05-06-admin-project-cards-design.md`
5. `docs/superpowers/plans/2026-05-06-admin-project-cards.md`

### 保持不变

1. `app/types/page-settings.ts`
2. `app/pages/projects.vue`
3. 服务端页面设置接口相关文件

## 验收标准

1. 管理员后台项目列表采用紧凑卡片网格展示。
2. 完整项目编辑字段仅在弹窗中出现。
3. 卡片支持启用状态切换、打开编辑弹窗、删除项目。
4. 新增、删除、编辑、标签同步、保存、重置行为保持有效。
5. 手机、平板、桌面端布局均正常。
6. 相关静态测试通过。

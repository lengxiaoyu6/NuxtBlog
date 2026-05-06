# 后台模板视觉迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以 `blog-admin-ui-template/` 为唯一视觉基准，完成当前项目管理员后台的整页样式迁移，并保留现有业务逻辑与数据交互。

**Architecture:** 通过后台专属主题包装层覆盖品牌色与背景渐变，使模板视觉限定在后台范围内；登录页、首次改密页与文章编辑页采用模板同系结构重写；其余后台页面沿用已存在的 Nuxt UI 结构并统一到新的主题令牌与外壳。测试以源码断言为主，保证模板迁移页与共享布局持续符合约定。

**Tech Stack:** Nuxt 4、Vue 3、@nuxt/ui、Tailwind CSS、Vitest

---

### Task 1: 后台主题基线

**Files:**
Create: `docs/superpowers/plans/2026-05-06-admin-ui-template-migration.md`
Modify: `app/assets/css/main.css`
Modify: `app/layouts/admin.vue`
Test: `tests/app/admin-ui-refactor.test.ts`

- [ ] 新增后台专属主题包装层，覆盖后台使用的 `brand` 与 `primary` 色阶。
- [ ] 为后台布局加入模板同系的径向渐变背景与磨砂外壳。
- [ ] 保持公开前台现有主题行为不受后台包装层影响。

### Task 2: 后台鉴权页迁移

**Files:**
Create: `app/components/admin/AdminAuthShell.vue`
Modify: `app/pages/admin/login.vue`
Modify: `app/pages/admin/password-setup.vue`
Test: `tests/app/admin-ui-refactor.test.ts`

- [ ] 抽出后台鉴权共享壳层，统一品牌区、标题区、卡片容器与底部返回入口。
- [ ] 登录页切换到模板同系表单样式，并保留登录、人机校验、重定向与错误提示逻辑。
- [ ] 首次改密页切换到模板同系表单样式，并保留改密与退出登录逻辑。
- [ ] 清理鉴权页中的 `lucide-vue-next` 页面级引用。

### Task 3: 文章编辑页迁移

**Files:**
Modify: `app/pages/admin/posts/new.vue`
Test: `tests/app/admin-ui-refactor.test.ts`

- [ ] 将文章编辑页的页头、三栏编辑区域、封面区、摘要区与发布设置区统一到模板风格。
- [ ] 优先使用 `UCard`、`UButton`、`UIcon` 等 Nuxt UI 组件承载主要壳层与操作按钮。
- [ ] 保留编辑器、上传、分类、标签、保存与发布逻辑。
- [ ] 清理文章编辑页中的 `lucide-vue-next` 页面级引用。

### Task 4: 共享后台页面一致性

**Files:**
Modify: `app/pages/admin/settings.vue`
Modify: `app/pages/admin/modules/[moduleKey].vue`
Modify: `app/pages/admin/media.vue`
Modify: `app/components/admin/media/*.vue`
Test: `tests/app/admin-ui-refactor.test.ts`
Test: `tests/app/admin-module-center-ui.test.ts`

- [ ] 让设置页、模块详情页与媒体库继承后台主题包装层的新色阶与背景感受。
- [ ] 调整残留的旧灰黑白视觉控件，使其与模板卡片、标签、输入区风格保持一致。
- [ ] 保持模块配置、测试发信、媒体上传与预览等现有业务行为。

### Task 5: 验证

**Files:**
Modify: `tests/app/admin-ui-refactor.test.ts`
Modify: `tests/app/admin-module-center-ui.test.ts`

- [ ] 先补充体现模板迁移目标的失败测试。
- [ ] 实施页面修改后重新运行后台 UI 测试。
- [ ] 运行完整构建，确认模板迁移未破坏生产构建。

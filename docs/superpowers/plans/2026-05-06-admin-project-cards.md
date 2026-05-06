# 后台项目列表弹窗编辑 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将管理员后台项目管理页的项目列表调整为摘要卡片配合弹窗编辑，同时保持现有保存、校验与项目增删逻辑不变。

**Architecture:** 保留 `app/pages/admin/pages/projects.vue` 作为页面容器，页面层继续持有项目数组、标签同步、保存与校验逻辑，并新增项目编辑弹窗状态。`AdminProjectEditorCard` 调整为摘要卡片，仅承载项目概览、启用开关、编辑与删除操作；完整字段表单迁移到页面层的 `UModal` 内容区。

**Tech Stack:** Nuxt 3、Vue 3、Nuxt UI、Tailwind CSS、Vitest

---

### Task 1: 先补弹窗编辑静态测试

**Files:**
Create: 无  
Modify: `tests/app/admin-ui-refactor.test.ts`  
Test: `tests/app/admin-ui-refactor.test.ts`

- [ ] **Step 1: 修改项目页断言，约束页面具备弹窗编辑结构**

```ts
  it('renders admin projects management with card editor components and modal editing state', () => {
    const source = readSource('app/pages/admin/pages/projects.vue');

    expect(source).toContain('AdminProjectEditorCard');
    expect(source).toContain('UModal');
    expect(source).toContain('isProjectEditorOpen');
    expect(source).toContain('editingProjectId');
    expect(source).toContain('openProjectEditor');
    expect(source).toContain('closeProjectEditor');
    expect(source).toContain('syncProjectTags(editingProject.id)');
    expect(source).toContain('项目描述');
    expect(source).toContain('GitHub 链接');
  });
```

- [ ] **Step 2: 修改卡片组件断言，约束组件仅保留摘要结构**

```ts
  it('renders admin project editor card as summary surface with edit action', () => {
    const source = readSource('app/components/admin/pages/AdminProjectEditorCard.vue');

    expect(source).toContain("emit('edit')");
    expect(source).toContain('在前台展示');
    expect(source).toContain('编辑项目');
    expect(source).not.toContain('项目描述');
    expect(source).not.toContain('GitHub 链接');
    expect(source).not.toContain('演示链接');
    expect(source).not.toContain('封面图片链接');
  });
```

- [ ] **Step 3: 运行测试并确认失败**

Run:

```bash
pnpm vitest run tests/app/admin-ui-refactor.test.ts
```

Expected: FAIL，提示页面尚未包含 `UModal` 与编辑状态，卡片组件仍保留完整字段输入结构。

### Task 2: 调整摘要卡片组件

**Files:**
Create: 无  
Modify: `app/components/admin/pages/AdminProjectEditorCard.vue`  
Test: `tests/app/admin-ui-refactor.test.ts`

- [ ] **Step 1: 修改组件事件定义，只保留摘要卡片相关交互**

```ts
const emit = defineEmits<{
  edit: [];
  remove: [];
}>();
```

保留 `project` 与 `tagsValue` 两个属性，用于展示摘要信息。

- [ ] **Step 2: 将模板改为摘要卡片结构**

卡片应保留：

```vue
<article class="admin-theme-card overflow-hidden rounded-[2rem] border border-slate-200/80 dark:border-slate-700/80">
  <div class="flex items-start justify-between gap-4 p-5">
    <div class="min-w-0 space-y-1">
      <div class="flex items-center gap-2">
        <span class="...">{{ project.enabled ? '展示中' : '已停用' }}</span>
        <span class="text-xs text-slate-400">{{ tagCountText }}</span>
      </div>
      <h3 class="truncate text-lg font-black text-slate-900 dark:text-white">{{ titleText }}</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400">{{ categoryText }}</p>
    </div>
    <button type="button" class="..." @click="emit('remove')">
      <Trash2 :size="16" />
    </button>
  </div>

  <div class="px-5 pb-5">
    <div class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      ...封面预览或占位图...
    </div>

    <p class="mt-4 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{{ descriptionText }}</p>

    <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
      <span class="...">{{ tagCountText }}</span>
      <span class="...">{{ linkCountText }}</span>
    </div>

    <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label class="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white">
        <input v-model="project.enabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500">
        在前台展示
      </label>
      <button type="button" class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700" @click="emit('edit')">
        <PencilLine :size="16" />
        编辑项目
      </button>
    </div>
  </div>
</article>
```

- [ ] **Step 3: 补充摘要计算属性**

```ts
const descriptionText = computed(() => props.project.description.trim() || '填写项目描述后会在此处显示摘要。');
const linkCountText = computed(() => {
  const count = [props.project.githubUrl, props.project.demoUrl]
    .filter((item) => item.trim())
    .length;

  return `${count} 个链接`;
});
```

- [ ] **Step 4: 暂不运行测试，等待页面弹窗接入后统一验证**

### Task 3: 页面接入弹窗编辑状态与完整表单

**Files:**
Create: 无  
Modify: `app/pages/admin/pages/projects.vue`  
Test: `tests/app/admin-ui-refactor.test.ts`

- [ ] **Step 1: 新增页面层编辑状态与方法**

在 `script setup` 中补充：

```ts
const isProjectEditorOpen = ref(false);
const editingProjectId = ref<string | null>(null);

const editingProject = computed(() => {
  if (!editingProjectId.value) {
    return null;
  }

  return form.value.projects.find((item) => item.id === editingProjectId.value) ?? null;
});

function openProjectEditor(id: string) {
  editingProjectId.value = id;
  isProjectEditorOpen.value = true;
}

function closeProjectEditor() {
  isProjectEditorOpen.value = false;
  editingProjectId.value = null;
}
```

- [ ] **Step 2: 调整新增与删除行为，保持编辑状态一致**

```ts
function addProject() {
  const id = `project-${Date.now()}`;
  form.value.projects.push({
    id,
    title: '',
    description: '',
    image: '',
    category: '',
    tags: [],
    githubUrl: '',
    demoUrl: '',
    enabled: true,
  });
  projectTags[id] = '';
  openProjectEditor(id);
}

function removeProject(id: string) {
  form.value.projects = form.value.projects.filter((item) => item.id !== id);
  delete projectTags[id];

  if (editingProjectId.value === id) {
    closeProjectEditor();
  }
}
```

- [ ] **Step 3: 调整卡片列表事件绑定**

```vue
<AdminProjectEditorCard
  v-for="item in form.projects"
  :key="item.id"
  :project="item"
  :tags-value="projectTags[item.id] ?? ''"
  @edit="openProjectEditor(item.id)"
  @remove="removeProject(item.id)"
/>
```

- [ ] **Step 4: 在页面模板加入 `UModal` 完整表单**

弹窗结构至少包含以下片段：

```vue
<UModal v-model:open="isProjectEditorOpen" :ui="{ content: 'max-w-4xl' }">
  <template #content>
    <div v-if="editingProject" class="admin-theme-card overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div class="flex items-center justify-between gap-4 border-b border-slate-200/70 px-6 py-5 dark:border-slate-800">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">项目编辑</p>
          <h3 class="mt-2 text-xl font-black text-slate-900 dark:text-white">{{ editingProject.title.trim() || '未命名项目' }}</h3>
        </div>
        <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="-my-1" @click="closeProjectEditor" />
      </div>

      <div class="space-y-6 px-6 py-6">
        ...项目标题、项目分类、项目描述、标签、封面图片链接、GitHub 链接、演示链接、启用状态...
      </div>
    </div>
  </template>
</UModal>
```

其中标签输入应继续使用：

```vue
<input
  :value="projectTags[editingProject.id] ?? ''"
  type="text"
  placeholder="标签，使用逗号分隔"
  ...
  @input="projectTags[editingProject.id] = ($event.target as HTMLInputElement).value"
  @change="syncProjectTags(editingProject.id)"
>
```

- [ ] **Step 5: 运行测试并确认转绿**

Run:

```bash
pnpm vitest run tests/app/admin-ui-refactor.test.ts
```

Expected: PASS，页面已包含弹窗编辑结构，卡片组件断言通过。

### Task 4: 回归验证并整理结果

**Files:**
Create: 无  
Modify: 无  
Test: `tests/app/admin-ui-refactor.test.ts`, `tests/app/admin-module-center-ui.test.ts`

- [ ] **Step 1: 运行后台 UI 相关回归测试**

Run:

```bash
pnpm vitest run tests/app/admin-ui-refactor.test.ts
pnpm vitest run tests/app/admin-module-center-ui.test.ts
```

Expected: 两个测试文件均通过。

- [ ] **Step 2: 检查本次改动文件范围**

Run:

```bash
git diff -- app/pages/admin/pages/projects.vue app/components/admin/pages/AdminProjectEditorCard.vue tests/app/admin-ui-refactor.test.ts docs/superpowers/specs/2026-05-06-admin-project-cards-design.md docs/superpowers/plans/2026-05-06-admin-project-cards.md
```

Expected: 仅出现本事项相关文件差异。

- [ ] **Step 3: 整理验证结果并汇报当前状态**

汇报内容包含：

1. 摘要卡片与弹窗编辑是否已完成。
2. 实际修改文件。
3. 测试命令与结果。
4. 当前是否执行 Git 提交。

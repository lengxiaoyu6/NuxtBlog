import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

test('README 聚焦项目介绍与部署说明，分支策略独立存放', async () => {
  await access(new URL('../BRANCHING.md', import.meta.url), constants.F_OK);

  const [readmeContent, branchingContent] = await Promise.all([
    readFile(new URL('../README.md', import.meta.url), 'utf8'),
    readFile(new URL('../BRANCHING.md', import.meta.url), 'utf8'),
  ]);

  assert.match(readmeContent, /^# Nuxt Blog$/m);
  assert.match(readmeContent, /^## 生产构建与启动$/m);
  assert.match(readmeContent, /^## Docker 部署$/m);
  assert.match(readmeContent, /^## 部署注意事项$/m);
  assert.doesNotMatch(readmeContent, /^## 分支管理$/m);
  assert.doesNotMatch(readmeContent, /BRANCHING\.md/);
  assert.doesNotMatch(readmeContent, /pnpm release:main/);
  assert.doesNotMatch(readmeContent, /MAIN_RELEASE\.md/);

  assert.match(branchingContent, /^# GitHub 博客系统分支管理方案$/m);
  assert.match(branchingContent, /`main`/);
  assert.match(branchingContent, /`develop`/);
  assert.match(branchingContent, /`feature\/\<topic\>`/);
  assert.match(branchingContent, /`release\/\<version-or-date\>`/);
  assert.match(branchingContent, /`hotfix\/\<topic\>`/);
  assert.match(branchingContent, /git init -b main/);
  assert.match(branchingContent, /git remote add origin/);
  assert.match(branchingContent, /https:\/\/github\.com\/lengxiaoyu6\/NuxtBlog/);
  assert.match(branchingContent, /git switch -c develop/);
  assert.match(branchingContent, /git cherry-pick -x/);
  assert.match(branchingContent, /Pull Request/);
  assert.match(branchingContent, /\.gitignore.*未跟踪文件/u);
  assert.doesNotMatch(branchingContent, /pnpm release:main/);
  assert.doesNotMatch(branchingContent, /\.release-mainignore/);
  assert.doesNotMatch(branchingContent, /单提交快照/u);
});

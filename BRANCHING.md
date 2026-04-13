# GitHub 博客系统分支管理方案

## 分支职责

仓库采用双长期分支与发布分支配合的方式维护业务历史。

1. `main` 保存可发布的业务代码、部署资产与运维脚本。
2. `develop` 保存日常开发内容，可包含测试文件、调试脚本与内部说明。
3. `feature/<topic>` 从 `develop` 切出，用于单个功能开发或缺陷修补。
4. `release/<version-or-date>` 从 `main` 切出，用于收集准备发布的业务提交。
5. `hotfix/<topic>` 从 `main` 切出，用于线上热修补。

`main` 通过连续业务提交保留发布历史，`develop` 保留完整开发上下文。

## `.gitignore` 的职责

`.gitignore` 只处理未跟踪文件，例如依赖目录、构建产物、日志、本地环境变量与本地媒体目录。
测试文件、调试脚本与内部说明是否进入 `main`，由提交拆分、`release/<version-or-date>` 摘取与 GitHub 校验共同控制。

## 首次建仓

当前工作区尚未建立 Git 元数据时，先用纯净业务文件初始化 `main`：

```bash
git init -b main
git add . \
  ':(exclude)tests' \
  ':(exclude)__tests__' \
  ':(exclude)**/__tests__' \
  ':(exclude)**/*.test.*' \
  ':(exclude)**/*.spec.*' \
  ':(exclude)scripts/dev' \
  ':(exclude)docs/superpowers'
git commit -m "feat: initialize blog system"
git remote add origin https://github.com/lengxiaoyu6/NuxtBlog
git push -u origin main
```

然后创建 `develop`，补入开发专用文件：

```bash
git switch -c develop
git add tests docs/superpowers
git commit -m "test: add development-only assets"
git push -u origin develop
```

## 日常开发

每项开发任务从 `develop` 切出独立功能分支，并把业务修改与测试修改拆成不同提交：

```bash
git switch develop
git pull origin develop
git switch -c feature/<topic>
```

建议提交顺序如下：

1. 业务文件提交使用 `feat:`、`fix:`。
2. 测试文件提交使用 `test:`。
3. 调试脚本与内部说明提交使用 `chore(dev):`。

功能分支完成后，通过 Pull Request 合入 `develop`，并保留原始提交结构，便于发布时只摘取业务提交。

## 发布流程

每次准备上线时，从 `main` 创建 `release/<version-or-date>`，再从 `develop` 摘取已经验证通过的业务提交：

```bash
git switch main
git pull origin main
git switch -c release/<version-or-date>
git cherry-pick -x <business-sha-1>
git cherry-pick -x <business-sha-2>
git diff --name-only origin/main...HEAD | node scripts/check-main-purity.mjs
pnpm build
git push -u origin release/<version-or-date>
```

发布分支通过检查后，向 `main` 发起 Pull Request，并采用 `Rebase and merge` 保留连续业务历史。

## 热修补

线上修补从 `main` 切出 `hotfix/<topic>`，先处理发布急需的业务文件，再回送 `develop`：

```bash
git switch main
git pull origin main
git switch -c hotfix/<topic>
```

热修补分支通过 Pull Request 合入 `main` 后，再把最新 `main` 合回 `develop`，同步版本修订与线上变更。如果需要补测试文件，在 `develop` 上追加对应 `test:` 提交即可。

## GitHub 设置

`main` 建议开启以下设置：

1. 只能通过 Pull Request 合入。
2. 至少一次代码审查。
3. 必须通过 `main-purity-check` 状态检查。
4. 启用线性历史。
5. 关闭 `Squash merge`，保留提交边界。

`develop` 也通过 Pull Request 接收修改，并保留业务提交与测试提交的拆分结构。

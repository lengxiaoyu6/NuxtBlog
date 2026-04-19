# `release:main` 提交说明输入实现计划

## 文件职责

`tests/release-main-script.test.mjs`
: 新增脚本测试，校验提交说明解析与交互输入逻辑。

`tests/main-purity-workflow.test.mjs`
: 修正与当前仓库现状矛盾的断言，避免测试资产误报。

`scripts/release-main.mjs`
: 增加参数解析、交互提示、提交说明校验与安全提交调用。

## 执行步骤

### 步骤 1

在 `tests/release-main-script.test.mjs` 编写失败测试，预期从 `scripts/release-main.mjs` 导入可测试的提交说明解析函数，并覆盖参数输入、交互输入、非交互终端与空白输入四类场景。

验证命令：

```bash
node --test tests/release-main-script.test.mjs
```

预期：导入失败或断言失败，证明测试先于实现存在。

### 步骤 2

在 `tests/main-purity-workflow.test.mjs` 修正 `release:main` 相关断言，使测试反映当前仓库实际保留了 `release:main` 脚本与 `scripts/release-main.mjs` 文件。

验证命令：

```bash
node --test tests/main-purity-workflow.test.mjs
```

预期：当前阶段仍可能因实现缺失失败，测试文本本身与仓库状态保持一致。

### 步骤 3

在 `scripts/release-main.mjs` 中增加以下实现：

1. 提交说明解析函数。
2. 交互终端提示函数。
3. 提交说明统一解析入口。
4. `git commit` 的参数数组调用。
5. 仅在存在待提交变更时才获取提交说明。
6. ESM 入口守卫，允许测试导入辅助函数。

验证命令：

```bash
node --test tests/release-main-script.test.mjs tests/main-purity-workflow.test.mjs
```

预期：新增测试通过。

### 步骤 4

运行与本次修改相关的完整验证，确认脚本行为与测试状态一致。

验证命令：

```bash
node --test tests/release-main-script.test.mjs tests/main-purity-workflow.test.mjs tests/main-purity-script.test.mjs
```

预期：全部通过。

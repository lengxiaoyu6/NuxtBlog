import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const helperModuleUrl = `${pathToFileURL(path.resolve('scripts/release-main-input.mjs')).href}?t=${Date.now()}`;
const { parseCommitMessageArgs, resolveCommitMessage } = await import(helperModuleUrl);

test('命令参数中的提交说明会被拼接并裁剪空白', () => {
  assert.equal(parseCommitMessageArgs(['  fix: 首页', '主题切换修正  ']), 'fix: 首页 主题切换修正');
});

test('命令参数为空白字符串时抛出错误', () => {
  assert.throws(() => parseCommitMessageArgs(['   ']), /提交说明不能为空/u);
});

test('交互终端会提示输入提交说明', async () => {
  let promptCount = 0;
  const message = await resolveCommitMessage({
    args: [],
    isInteractive: true,
    prompt: async () => {
      promptCount += 1;
      return '  chore: develop -> main  ';
    },
  });

  assert.equal(message, 'chore: develop -> main');
  assert.equal(promptCount, 1);
});

test('非交互终端且未传参数时抛出错误', async () => {
  await assert.rejects(
    resolveCommitMessage({
      args: [],
      isInteractive: false,
      prompt: async () => 'unused',
    }),
    /当前终端环境无法交互输入提交说明，请通过命令参数传入提交说明/u
  );
});

test('release-main 脚本会使用命令参数生成发布提交', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'release-main-'));
  const scriptsDir = path.join(tempDir, 'scripts');

  try {
    await mkdir(scriptsDir, { recursive: true });
    await Promise.all([
      cp(path.resolve('scripts/release-main.mjs'), path.join(scriptsDir, 'release-main.mjs')),
      cp(path.resolve('scripts/release-main-input.mjs'), path.join(scriptsDir, 'release-main-input.mjs')),
    ]);

    await writeFile(path.join(tempDir, 'README.md'), '# temp repo\n');

    await execFileAsync('git', ['init', '-b', 'main'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.name', 'Codex Test'], { cwd: tempDir });
    await execFileAsync('git', ['config', 'user.email', 'codex@example.com'], { cwd: tempDir });
    await execFileAsync('git', ['add', '.'], { cwd: tempDir });
    await execFileAsync('git', ['commit', '-m', 'chore: 初始化仓库'], { cwd: tempDir });

    await execFileAsync('git', ['switch', '-c', 'develop'], { cwd: tempDir });
    await writeFile(path.join(tempDir, 'app.txt'), 'release-main\n');
    await execFileAsync('git', ['add', '.'], { cwd: tempDir });
    await execFileAsync('git', ['commit', '-m', 'feat: develop 新增文件'], { cwd: tempDir });
    await execFileAsync('git', ['switch', 'main'], { cwd: tempDir });

    await execFileAsync(
      'node',
      [path.join(tempDir, 'scripts/release-main.mjs'), 'fix: 发布脚本支持输入提交说明'],
      {
        cwd: tempDir,
        encoding: 'utf8',
      }
    );

    const [{ stdout: commitMessage }, { stdout: statusOutput }] = await Promise.all([
      execFileAsync('git', ['log', '-1', '--pretty=%s'], { cwd: tempDir, encoding: 'utf8' }),
      execFileAsync('git', ['status', '--short'], { cwd: tempDir, encoding: 'utf8' }),
    ]);

    assert.equal(commitMessage.trim(), 'fix: 发布脚本支持输入提交说明');
    assert.equal(statusOutput.trim(), '');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

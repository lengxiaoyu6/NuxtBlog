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

async function createTempReleaseMainRepo() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'release-main-'));
  const scriptsDir = path.join(tempDir, 'scripts');

  await mkdir(scriptsDir, { recursive: true });
  await Promise.all([
    cp(path.resolve('scripts/release-main.mjs'), path.join(scriptsDir, 'release-main.mjs')),
    cp(path.resolve('scripts/release-main-input.mjs'), path.join(scriptsDir, 'release-main-input.mjs')),
  ]);

  return tempDir;
}

async function initGitRepo(tempDir) {
  await writeFile(path.join(tempDir, 'README.md'), '# temp repo\n');
  await execFileAsync('git', ['init', '-b', 'main'], { cwd: tempDir });
  await execFileAsync('git', ['config', 'user.name', 'Codex Test'], { cwd: tempDir });
  await execFileAsync('git', ['config', 'user.email', 'codex@example.com'], { cwd: tempDir });
  await execFileAsync('git', ['add', '.'], { cwd: tempDir });
  await execFileAsync('git', ['commit', '-m', 'chore: 初始化仓库'], { cwd: tempDir });
}

function runReleaseMainScript(tempDir, args = []) {
  return execFileAsync('node', [path.join(tempDir, 'scripts/release-main.mjs'), ...args], {
    cwd: tempDir,
    encoding: 'utf8',
  });
}

async function setupConflictRepo(tempDir) {
  await initGitRepo(tempDir);
  await execFileAsync('git', ['switch', '-c', 'develop'], { cwd: tempDir });

  await mkdir(path.join(tempDir, 'docs', 'superpowers'), { recursive: true });
  await Promise.all([
    writeFile(path.join(tempDir, 'conflict.txt'), 'develop\n'),
    writeFile(path.join(tempDir, 'keep.txt'), 'develop keep\n'),
    writeFile(path.join(tempDir, 'docs', 'superpowers', 'note.md'), 'dev only\n'),
  ]);
  await execFileAsync('git', ['add', '.'], { cwd: tempDir });
  await execFileAsync('git', ['commit', '-m', 'feat: develop 修改文件'], { cwd: tempDir });

  await execFileAsync('git', ['switch', 'main'], { cwd: tempDir });
  await writeFile(path.join(tempDir, 'conflict.txt'), 'main\n');
  await execFileAsync('git', ['add', 'conflict.txt'], { cwd: tempDir });
  await execFileAsync('git', ['commit', '-m', 'feat: main 修改冲突文件'], { cwd: tempDir });
}

async function createSquashMergeConflict(tempDir) {
  await setupConflictRepo(tempDir);

  try {
    await execFileAsync('git', ['merge', 'develop', '--squash'], {
      cwd: tempDir,
      encoding: 'utf8',
    });
  } catch (error) {
    return error;
  }

  throw new Error('预期 git merge develop --squash 产生冲突');
}

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
  const tempDir = await createTempReleaseMainRepo();

  try {
    await initGitRepo(tempDir);

    await execFileAsync('git', ['switch', '-c', 'develop'], { cwd: tempDir });
    await writeFile(path.join(tempDir, 'app.txt'), 'release-main\n');
    await execFileAsync('git', ['add', '.'], { cwd: tempDir });
    await execFileAsync('git', ['commit', '-m', 'feat: develop 新增文件'], { cwd: tempDir });
    await execFileAsync('git', ['switch', 'main'], { cwd: tempDir });

    await runReleaseMainScript(tempDir, ['fix: 发布脚本支持输入提交说明']);

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

test('release-main 脚本在合并冲突时会提示使用 continue 模式', async () => {
  const tempDir = await createTempReleaseMainRepo();

  try {
    await setupConflictRepo(tempDir);

    let failure = null;
    try {
      await runReleaseMainScript(tempDir, ['fix: 处理冲突']);
    } catch (error) {
      failure = error;
    }

    assert.ok(failure);
    const output = `${failure.stdout ?? ''}\n${failure.stderr ?? ''}`;
    assert.match(output, /pnpm release:main --continue/u);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('release-main 脚本在 continue 模式下会阻止未解决冲突', async () => {
  const tempDir = await createTempReleaseMainRepo();

  try {
    await createSquashMergeConflict(tempDir);

    let failure = null;
    try {
      await runReleaseMainScript(tempDir, ['--continue']);
    } catch (error) {
      failure = error;
    }

    assert.ok(failure);
    const output = `${failure.stdout ?? ''}\n${failure.stderr ?? ''}`;
    assert.match(output, /仍有未解决的冲突，请先解决所有冲突并 git add 后再执行 --continue/u);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('release-main 脚本在 continue 模式下会先统一暂存再提交', async () => {
  const tempDir = await createTempReleaseMainRepo();

  try {
    await createSquashMergeConflict(tempDir);
    await writeFile(path.join(tempDir, 'conflict.txt'), 'resolved\n');
    await execFileAsync('git', ['add', 'conflict.txt'], { cwd: tempDir });
    await writeFile(path.join(tempDir, 'keep.txt'), 'resolved keep with extra change\n');

    await runReleaseMainScript(tempDir, ['--continue', 'fix: 继续完成发布提交']);

    const [{ stdout: commitMessage }, { stdout: statusOutput }, { stdout: committedKeepFile }] = await Promise.all([
      execFileAsync('git', ['log', '-1', '--pretty=%s'], { cwd: tempDir, encoding: 'utf8' }),
      execFileAsync('git', ['status', '--short'], { cwd: tempDir, encoding: 'utf8' }),
      execFileAsync('git', ['show', 'HEAD:keep.txt'], { cwd: tempDir, encoding: 'utf8' }),
    ]);

    assert.equal(commitMessage.trim(), 'fix: 继续完成发布提交');
    assert.equal(statusOutput.trim(), '');
    assert.equal(committedKeepFile, 'resolved keep with extra change\n');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

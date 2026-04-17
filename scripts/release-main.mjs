#!/usr/bin/env node

/**
 * 将 develop 合并到 main，并自动清理测试/开发专用文件。
 *
 * 用法（在 main 分支上执行）：
 *   pnpm release:main              # 正常合并
 *   pnpm release:main --continue   # 解决冲突后继续
 */

import { execSync } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const continueMode = process.argv.includes('--continue');

const DEV_ONLY_PATHS = [
    'tests',
    '__tests__',
    'scripts/dev',
    'scripts/check-main-purity.mjs',
    'docs/superpowers',
    'BRANCHING.md',
    '.github',
];

const DEV_ONLY_PATTERNS = [/\.test\.[^/]+$/u, /\.spec\.[^/]+$/u];

function run(cmd) {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function tryRun(cmd) {
    try {
        execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
        return true;
    } catch {
        return false;
    }
}

function currentBranch() {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT }).toString().trim();
}

function mergedFiles() {
    const base = execSync('git merge-base HEAD develop', { cwd: ROOT }).toString().trim();
    return execSync(`git diff --name-only ${base} develop`, { cwd: ROOT })
        .toString()
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);
}

function hasConflicts() {
    const status = execSync('git status --porcelain', { cwd: ROOT }).toString();
    return /^(U[ADMU]|[ADMU]U|AA|DD) /mu.test(status);
}

function isDevOnly(filePath) {
    const normalized = filePath.replace(/\\/gu, '/');
    if (DEV_ONLY_PATHS.some((p) => normalized === p || normalized.startsWith(p + '/'))) {
        return true;
    }
    return DEV_ONLY_PATTERNS.some((re) => re.test(normalized));
}

function cleanupAndCommit(devFiles) {
    if (devFiles.length > 0) {
        console.log('\n清理开发专用文件...');
        for (const f of devFiles) {
            const abs = join(ROOT, f);
            if (existsSync(abs)) rmSync(abs, { recursive: true, force: true });
            run(`git rm -rf --cached --ignore-unmatch "${f}"`);
        }
    }

    run('git add -A');

    const hasChanges = execSync('git status --porcelain', { cwd: ROOT }).toString().trim().length > 0;

    if (!hasChanges) {
        console.log('合并完成，develop 与 main 内容一致，无需提交。');
    } else {
        run('git commit -m "chore: merge develop into main"');
        if (devFiles.length > 0) {
            console.log('合并完成，测试文件已从提交中移除。');
        } else {
            console.log('合并完成，无开发专用文件需要清理。');
        }
    }
}

// ── 主流程 ──

const branch = currentBranch();
if (branch !== 'main') {
    console.error(`请在 main 分支上执行，当前分支：${branch}`);
    process.exit(1);
}

const devFiles = mergedFiles().filter(isDevOnly);

if (continueMode) {
    if (hasConflicts()) {
        console.error('仍有未解决的冲突，请先解决所有冲突并 git add 后再执行 --continue。');
        process.exit(1);
    }
    console.log('继续合并流程...');
    cleanupAndCommit(devFiles);
} else {
    if (devFiles.length > 0) {
        console.log('以下开发专用文件将在合并后被自动移除：');
        for (const f of devFiles) console.log(`  - ${f}`);
        console.log('');
    }

    console.log('合并 develop...');
    const ok = tryRun('git merge develop --squash');

    if (!ok) {
        if (hasConflicts()) {
            console.log('\n合并出现冲突，请手动解决后执行：');
            console.log('  1. 解决冲突文件');
            console.log('  2. git add <已解决的文件>');
            console.log('  3. pnpm release:main --continue\n');
        } else {
            console.error('合并失败，请检查 git 状态后重试。');
            console.error('如果存在未提交的本地更改，请先提交或 stash 后再执行。');
        }
        process.exit(1);
    }

    cleanupAndCommit(devFiles);
}

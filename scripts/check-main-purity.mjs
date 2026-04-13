#!/usr/bin/env node

import process from 'node:process';

const disallowedMatchers = [
  /^tests\//u,
  /(?:^|\/)__tests__\//u,
  /\.test\.[^/]+$/u,
  /\.spec\.[^/]+$/u,
  /^scripts\/dev\//u,
  /^docs\/superpowers\//u,
];

function normalizePath(filePath) {
  return filePath.trim().replace(/\\/gu, '/');
}

function isDisallowed(filePath) {
  return disallowedMatchers.some((matcher) => matcher.test(filePath));
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let content = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      content += chunk;
    });
    process.stdin.on('end', () => {
      resolve(content);
    });
    process.stdin.on('error', reject);
  });
}

async function collectFilePaths(argv = process.argv.slice(2)) {
  const argumentPaths = argv.map(normalizePath).filter(Boolean);

  if (argumentPaths.length > 0) {
    return argumentPaths;
  }

  if (process.stdin.isTTY) {
    return [];
  }

  const stdinContent = await readStdin();
  return stdinContent
    .split(/\r?\n/gu)
    .map(normalizePath)
    .filter(Boolean);
}

async function main() {
  const filePaths = await collectFilePaths();
  const violations = filePaths.filter(isDisallowed);

  if (violations.length === 0) {
    console.log('main 分支文件检查通过');
    return;
  }

  console.error('main 分支禁止合入以下开发专用文件：');
  for (const filePath of violations) {
    console.error(`- ${filePath}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'main 分支文件检查失败');
  process.exitCode = 1;
});

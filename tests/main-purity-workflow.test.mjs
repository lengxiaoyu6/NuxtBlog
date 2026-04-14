import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

test('仓库资产切换到 main 纯净校验流程', async () => {
  await access(new URL('../.github/workflows/main-purity-check.yml', import.meta.url), constants.F_OK);

  const [workflowContent, packageContent, gitignoreContent] = await Promise.all([
    readFile(new URL('../.github/workflows/main-purity-check.yml', import.meta.url), 'utf8'),
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
    readFile(new URL('../.gitignore', import.meta.url), 'utf8'),
  ]);

  assert.match(workflowContent, /pull_request:/);
  assert.match(workflowContent, /- main/);
  assert.match(workflowContent, /actions\/checkout@v4/);
  assert.match(workflowContent, /github\.event\.pull_request\.base\.sha/);
  assert.match(workflowContent, /github\.event\.pull_request\.head\.sha/);
  assert.match(workflowContent, /node scripts\/check-main-purity\.mjs/);

  const packageJson = JSON.parse(packageContent);
  assert.equal(packageJson.scripts['check:main-purity'], 'node scripts/check-main-purity.mjs');
  assert.equal(Object.hasOwn(packageJson.scripts, 'release:main'), false);

  assert.doesNotMatch(gitignoreContent, /^docs\/$/m);

  await Promise.all([
    assert.rejects(access(new URL('../MAIN_RELEASE.md', import.meta.url), constants.F_OK)),
    assert.rejects(access(new URL('../.release-mainignore', import.meta.url), constants.F_OK)),
    assert.rejects(access(new URL('../scripts/release-main.mjs', import.meta.url), constants.F_OK)),
  ]);
});

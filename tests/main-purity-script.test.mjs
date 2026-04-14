import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptPath = path.resolve('scripts/check-main-purity.mjs');

test('main 纯净校验脚本允许业务文件通过', async () => {
  const { stdout, stderr } = await execFileAsync('node', [scriptPath, 'README.md', 'app/demo.txt'], {
    encoding: 'utf8',
  });

  assert.match(stdout, /main 分支文件检查通过/);
  assert.equal(stderr, '');
});

test('main 纯净校验脚本阻止测试与开发专用文件', async () => {
  await assert.rejects(
    execFileAsync(
      'node',
      [
        scriptPath,
        'tests/demo.test.mjs',
        'app/__tests__/widget.spec.ts',
        'docs/superpowers/specs/doc.md',
        'scripts/dev/debug.mjs',
      ],
      {
        encoding: 'utf8',
      }
    ),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /tests\/demo\.test\.mjs/);
      assert.match(error.stderr, /app\/__tests__\/widget\.spec\.ts/);
      assert.match(error.stderr, /docs\/superpowers\/specs\/doc\.md/);
      assert.match(error.stderr, /scripts\/dev\/debug\.mjs/);
      return true;
    }
  );
});

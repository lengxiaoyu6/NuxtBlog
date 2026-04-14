import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = new URL('..', import.meta.url);
const projectRootPath = fileURLToPath(projectRoot);

async function loadPrismaModule() {
  const outputDirectory = await mkdtemp(path.join(projectRootPath, '.tmp-blog2-prisma-'));
  const compileResult = spawnSync(
    'pnpm',
    [
      'exec',
      'tsc',
      '--ignoreConfig',
      '--noCheck',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2022',
      '--outDir',
      outputDirectory,
      'server/utils/prisma.ts',
    ],
    {
      cwd: projectRootPath,
      encoding: 'utf8',
    },
  );

  assert.equal(
    compileResult.status,
    0,
    `prisma.ts 编译失败\nSTDOUT:\n${compileResult.stdout}\nSTDERR:\n${compileResult.stderr}`,
  );

  const modulePath = path.join(outputDirectory, 'prisma.js');
  const compiledModule = await import(`${pathToFileURL(modulePath).href}?cacheBust=${Date.now()}`);

  return {
    compiledModule,
    outputDirectory,
  };
}

test('DATABASE_URL 环境变量存在时，数据库地址优先采用环境变量', async () => {
  const { compiledModule, outputDirectory } = await loadPrismaModule();

  try {
    assert.equal(typeof compiledModule.resolveDatabaseUrl, 'function');
    assert.equal(
      compiledModule.resolveDatabaseUrl(
        'mysql://runtime-user:runtime-password@127.0.0.1:3306/nuxt-blog',
        ' mysql://env-user:env-password@db:3306/nuxt-blog?allowPublicKeyRetrieval=true ',
      ),
      'mysql://env-user:env-password@db:3306/nuxt-blog?allowPublicKeyRetrieval=true',
    );
  }
  finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test('DATABASE_URL 环境变量缺失时，数据库地址采用运行期配置值', async () => {
  const { compiledModule, outputDirectory } = await loadPrismaModule();

  try {
    assert.equal(typeof compiledModule.resolveDatabaseUrl, 'function');
    assert.equal(
      compiledModule.resolveDatabaseUrl('mysql://runtime-user:runtime-password@127.0.0.1:3306/nuxt-blog'),
      'mysql://runtime-user:runtime-password@127.0.0.1:3306/nuxt-blog',
    );
  }
  finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

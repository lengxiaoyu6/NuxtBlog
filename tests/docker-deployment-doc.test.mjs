import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Docker 部署文档覆盖容器内数据库与外部数据库两种方式', async () => {
  const content = await readFile(new URL('../DOCKER_DEPLOYMENT.md', import.meta.url), 'utf8');

  assert.match(content, /Docker 部署指南/);
  assert.match(content, /方案一：MySQL 运行在 Docker Compose 内/);
  assert.match(content, /方案二：使用外部 MySQL/);
  assert.match(content, /compose\.with-db\.yml/);
  assert.match(content, /compose\.external-db\.yml/);
  assert.match(content, /docker build -t nuxt-blog:latest \./);
  assert.match(content, /默认仍使用官方源/);
  assert.match(content, /中国服务器构建加速/);
  assert.match(content, /APT_MIRROR/);
  assert.match(content, /NPM_REGISTRY/);
  assert.match(content, /Corepack/);
  assert.match(content, /docker build[\s\S]*--build-arg APT_MIRROR=/);
  assert.match(content, /--build-arg APT_MIRROR=/);
  assert.match(content, /docker compose -f compose\.with-db\.yml build/);
  assert.match(content, /allowPublicKeyRetrieval=true/);
  assert.match(content, /应用容器启动时会自动执行 `pnpm exec prisma db push`/);
  assert.match(content, /\/app\/storage\/media/);
  assert.match(content, /占位值/);
  assert.match(content, /正式部署前必须替换/);
  assert.match(content, /SECURITY_HASH_SALT/);
  assert.match(content, /TURNSTILE_SECRET_KEY/);
  assert.match(content, /admin123/);
});

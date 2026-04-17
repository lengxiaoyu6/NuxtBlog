import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const envSessionPassword = process.env.NUXT_SESSION_PASSWORD;
const projectRoot = process.cwd();
const nuxtConfigUrl = pathToFileURL(path.resolve(projectRoot, 'nuxt.config.ts')).href;
const entrypointPath = path.resolve(projectRoot, 'docker/entrypoint.sh');
const sessionPasswordGuardPluginUrl = pathToFileURL(path.resolve(projectRoot, 'server/plugins/00.session-password-guard.ts')).href;

vi.stubGlobal('defineNuxtConfig', (config: unknown) => config);
vi.stubGlobal('defineNitroPlugin', (plugin: unknown) => plugin);

async function loadNuxtConfig() {
  vi.resetModules();
  const imported = await import(`${nuxtConfigUrl}?t=${Date.now()}`);
  return imported.default;
}

async function loadSessionPasswordGuardPlugin() {
  vi.resetModules();
  const imported = await import(`${sessionPasswordGuardPluginUrl}?t=${Date.now()}`);
  return imported.default as () => void;
}

afterEach(() => {
  if (typeof envSessionPassword === 'string') {
    process.env.NUXT_SESSION_PASSWORD = envSessionPassword;
    return;
  }

  delete process.env.NUXT_SESSION_PASSWORD;
});

describe('nuxt.config session password', () => {
  it('缺少环境变量时写入启动校验占位标记', async () => {
    delete process.env.NUXT_SESSION_PASSWORD;

    const config = await loadNuxtConfig();

    expect(String(config.runtimeConfig.session.password)).toMatch(/^__blog2_missing_session_password__:/);
  });

  it('存在环境变量时仍然写入启动校验占位标记，避免把真实密钥写入构建配置', async () => {
    process.env.NUXT_SESSION_PASSWORD = '  12345678901234567890123456789012  ';

    const config = await loadNuxtConfig();

    expect(String(config.runtimeConfig.session.password)).toMatch(/^__blog2_missing_session_password__:/);
  });
});

describe('docker entrypoint session password guard', () => {
  it('会在数据库检查之前拒绝短会话密钥', () => {
    const mediaStorageDir = mkdtempSync(path.join(tmpdir(), 'blog2-media-'));

    try {
      const result = spawnSync('sh', [entrypointPath, 'true'], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          DATABASE_URL: 'mysql://root:password@127.0.0.1:3306/nuxt-blog',
          DATABASE_WAIT_MAX_ATTEMPTS: '0',
          MEDIA_STORAGE_DIR: mediaStorageDir,
          NUXT_SESSION_PASSWORD: 'short-password',
        },
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('NUXT_SESSION_PASSWORD 至少需要 32 个字符');
      expect(result.stderr).not.toContain('数据库在等待窗口内仍未就绪');
    }
    finally {
      rmSync(mediaStorageDir, { force: true, recursive: true });
    }
  });
});

describe('nitro session password guard plugin', () => {
  it('会把运行期环境变量归一化为去除首尾空白后的值', async () => {
    process.env.NUXT_SESSION_PASSWORD = '  12345678901234567890123456789012  ';
    const runtimeConfig = Object.freeze({
      session: Object.freeze({
        password: '__blog2_missing_session_password__:test',
      }),
    });
    vi.stubGlobal('useRuntimeConfig', () => runtimeConfig);

    const plugin = await loadSessionPasswordGuardPlugin();

    plugin();

    expect(process.env.NUXT_SESSION_PASSWORD).toBe('12345678901234567890123456789012');
  });
});

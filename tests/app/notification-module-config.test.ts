import { afterEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = process.cwd();
const nuxtConfigUrl = pathToFileURL(path.resolve(projectRoot, 'nuxt.config.ts')).href;

const envEncryptionSecretKey = process.env.ENCRYPTION_SECRET_KEY;
const envNotificationSecretKey = process.env.NOTIFICATION_SECRET_KEY;

vi.stubGlobal('defineNuxtConfig', (config: unknown) => config);

async function loadNuxtConfig() {
  vi.resetModules();
  const imported = await import(`${nuxtConfigUrl}?t=${Date.now()}`);
  return imported.default;
}

afterEach(() => {
  if (typeof envEncryptionSecretKey === 'string') {
    process.env.ENCRYPTION_SECRET_KEY = envEncryptionSecretKey;
  }
  else {
    delete process.env.ENCRYPTION_SECRET_KEY;
  }

  if (typeof envNotificationSecretKey === 'string') {
    process.env.NOTIFICATION_SECRET_KEY = envNotificationSecretKey;
  }
  else {
    delete process.env.NOTIFICATION_SECRET_KEY;
  }
});

describe('notification module configuration', () => {
  it('在 Nuxt 配置中注册本地邮件通知模块', async () => {
    const config = await loadNuxtConfig();

    expect(config.modules).toContain('./modules/notification-center/module');
  });

  it('从 ENCRYPTION_SECRET_KEY 读取通用加密密钥', async () => {
    process.env.ENCRYPTION_SECRET_KEY = 'general-encryption-secret';
    delete process.env.NOTIFICATION_SECRET_KEY;

    const config = await loadNuxtConfig();

    expect(config.runtimeConfig.encryptionSecretKey).toBe('general-encryption-secret');
  });

  it('在缺少新变量时兼容读取 NOTIFICATION_SECRET_KEY', async () => {
    delete process.env.ENCRYPTION_SECRET_KEY;
    process.env.NOTIFICATION_SECRET_KEY = 'legacy-notification-secret';

    const config = await loadNuxtConfig();

    expect(config.runtimeConfig.encryptionSecretKey).toBe('legacy-notification-secret');
  });
});

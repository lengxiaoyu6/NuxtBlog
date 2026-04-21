import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('notification runtime assets', () => {
  it('声明 nodemailer 作为运行期邮件发送依赖', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies?.nodemailer).toBeTruthy();
  });

  it('在 Prisma schema 中声明通知投递模型', () => {
    const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8');

    expect(schema).toContain('enum NotificationDeliveryStatus');
    expect(schema).toContain('model NotificationDelivery');
    expect(schema).toContain('@@map("notification_deliveries")');
  });
});

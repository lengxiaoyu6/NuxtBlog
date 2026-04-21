# 通知配置测试发信 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在后台邮件通知页签中增加基于已保存配置的测试发信能力，并将发送结果写入现有通知投递记录。

**Architecture:** 保持 `notification-center` 模块现有职责不变，在 `notification-delivery.service.ts` 中扩展测试发信方法，并通过新增管理员接口提供调用入口。前端测试发信区域使用 `savedSnapshot.notification` 作为数据源，与服务端“读取最近一次保存配置”的规则保持一致。

**Tech Stack:** Nuxt 3、Nitro server routes、TypeScript、Vitest、现有通知投递仓储与 SMTP 发送能力

---

### Task 1: 补齐测试发信表单辅助逻辑

**Files:**
Create: 无
Modify: `app/utils/notification-form.ts`
Test: `tests/app/notification-form.test.ts`

- [ ] **Step 1: 先写失败测试，描述测试邮箱选择校验行为**

```ts
it('requires a saved admin recipient to send a test email', () => {
  const errors = validateNotificationTestEmailForm({
    recipient: '',
    availableRecipients: ['admin@example.com'],
  });

  expect(errors.recipient).toBe('请选择一个已保存的管理员邮箱');
});

it('rejects a recipient outside the saved admin recipients', () => {
  const errors = validateNotificationTestEmailForm({
    recipient: 'other@example.com',
    availableRecipients: ['admin@example.com'],
  });

  expect(errors.recipient).toBe('测试收件邮箱必须来自已保存的管理员邮箱');
});
```

- [ ] **Step 2: 运行单测并确认失败**

Run: `pnpm vitest run tests/app/notification-form.test.ts`
Expected: `FAIL`，提示 `validateNotificationTestEmailForm` 未定义或相关断言失败。

- [ ] **Step 3: 在通知表单工具中实现最小测试发信校验函数**

```ts
export interface NotificationTestEmailFormInput {
  recipient: string;
  availableRecipients: string[];
}

export function validateNotificationTestEmailForm(input: NotificationTestEmailFormInput): NotificationFormErrors {
  const errors: NotificationFormErrors = {};
  const recipient = input.recipient.trim();
  const recipients = input.availableRecipients.map(item => item.trim()).filter(Boolean);

  if (!recipients.length) {
    errors.recipient = '当前没有可用于测试发信的已保存管理员邮箱';
    return errors;
  }

  if (!recipient) {
    errors.recipient = '请选择一个已保存的管理员邮箱';
    return errors;
  }

  if (!recipients.includes(recipient)) {
    errors.recipient = '测试收件邮箱必须来自已保存的管理员邮箱';
  }

  return errors;
}
```

- [ ] **Step 4: 重新运行单测并确认通过**

Run: `pnpm vitest run tests/app/notification-form.test.ts`
Expected: `PASS`。

### Task 2: 先用服务端测试驱动测试发信能力

**Files:**
Create: `server/api/admin/settings/notification/test.post.ts`
Modify: `server/services/notification-delivery.service.ts`, `server/services/site-settings.service.ts`
Test: `tests/server/services/notification-delivery.service.test.ts`

- [ ] **Step 1: 先在服务测试中增加测试发信场景**

```ts
it('sends a notification test email with saved settings even when notification is disabled', async () => {
  const readNotificationSettings = vi.fn().mockResolvedValue(createNotificationSettings({ enabled: false }));
  const createQueuedNotificationDeliveryRecord = vi.fn().mockResolvedValue({
    id: 'delivery-test',
    queuedAt,
  });
  const sendMail = vi.fn().mockResolvedValue({ messageId: 'message-test' });
  const createTransport = vi.fn().mockResolvedValue({ sendMail });

  const service = createNotificationDeliveryService({
    readNotificationSettings,
    createQueuedNotificationDeliveryRecord,
    createTransport,
    markNotificationDeliveryAsSent: vi.fn(),
    markNotificationDeliveryAsFailed: vi.fn(),
    emitDeliveryQueued: vi.fn(),
    emitDeliverySent: vi.fn(),
    emitDeliveryFailed: vi.fn(),
    now: vi.fn().mockReturnValueOnce(queuedAt).mockReturnValueOnce(sentAt),
  });

  await service.sendNotificationTestEmail('admin@example.com');

  expect(createQueuedNotificationDeliveryRecord).toHaveBeenCalledWith(expect.objectContaining({
    eventName: 'system:notification:test',
    recipients: ['admin@example.com'],
    subject: '[Blog 通知] 邮件配置测试',
  }));
  expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
    to: ['admin@example.com'],
    subject: '[Blog 通知] 邮件配置测试',
  }));
});

it('rejects a test recipient outside the saved admin recipients', async () => {
  const service = createNotificationDeliveryService({
    readNotificationSettings: vi.fn().mockResolvedValue(createNotificationSettings()),
  });

  await expect(service.sendNotificationTestEmail('other@example.com')).rejects.toMatchObject({
    statusCode: 400,
    statusMessage: '测试收件邮箱必须来自已保存的管理员邮箱',
  });
});
```

- [ ] **Step 2: 运行服务测试并确认失败**

Run: `pnpm vitest run tests/server/services/notification-delivery.service.test.ts`
Expected: `FAIL`，提示 `sendNotificationTestEmail` 不存在或新断言失败。

- [ ] **Step 3: 在通知投递服务中实现独立测试发信校验与发送**

```ts
const NOTIFICATION_TEST_EVENT_NAME = 'system:notification:test';

function validateNotificationTestRecipient(settings: SiteNotificationSettings, recipient: string) {
  const normalizedRecipient = recipient.trim();

  if (!normalizedRecipient) {
    throw createError({ statusCode: 400, statusMessage: '请选择一个已保存的管理员邮箱' });
  }

  if (!EMAIL_PATTERN.test(normalizedRecipient)) {
    throw createError({ statusCode: 400, statusMessage: '测试收件邮箱格式无效' });
  }

  if (!settings.adminRecipients.includes(normalizedRecipient)) {
    throw createError({ statusCode: 400, statusMessage: '测试收件邮箱必须来自已保存的管理员邮箱' });
  }

  validateNotificationTestSmtpSettings(settings);
  return normalizedRecipient;
}

async sendNotificationTestEmail(recipient: string) {
  const settings = await readNotificationSettingsImpl();
  const normalizedRecipient = validateNotificationTestRecipient(settings, recipient);
  const message = createNotificationTestMessage(settings, normalizedRecipient, now());
  return await deliverMessage({
    eventName: NOTIFICATION_TEST_EVENT_NAME,
    settings,
    message,
    payload: { recipient: normalizedRecipient, triggeredAt: now().toISOString() },
  });
}
```

- [ ] **Step 4: 在设置服务中补充可复用测试 SMTP 校验函数或导出校验工具**

```ts
export function validateNotificationTestSettings(input: SiteNotificationSettings) {
  if (!input.smtp.host) {
    throw createError({ statusCode: 400, statusMessage: '测试发信前必须先保存 SMTP 主机' });
  }

  if (!Number.isInteger(input.smtp.port) || input.smtp.port < 1 || input.smtp.port > 65535) {
    throw createError({ statusCode: 400, statusMessage: 'SMTP 端口需填写 1 到 65535 之间的整数' });
  }

  if (!input.smtp.username) {
    throw createError({ statusCode: 400, statusMessage: '测试发信前必须先保存 SMTP 用户名' });
  }

  if (!input.smtp.password.trim()) {
    throw createError({ statusCode: 400, statusMessage: '测试发信前必须先保存 SMTP 密码' });
  }
}
```

- [ ] **Step 5: 新增管理员接口并接入服务**

```ts
export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const body = await readBody<{ recipient?: string }>(event);
  const recipient = typeof body?.recipient === 'string' ? body.recipient : '';

  await sendNotificationTestEmail(recipient);

  return {
    ok: true,
    message: `测试邮件已发送至 ${recipient.trim()}`,
  };
});
```

- [ ] **Step 6: 重新运行服务测试并确认通过**

Run: `pnpm vitest run tests/server/services/notification-delivery.service.test.ts`
Expected: `PASS`。

### Task 3: 先用前端页面测试驱动测试发信交互

**Files:**
Create: 无
Modify: `app/pages/admin/settings.vue`, `app/types/admin-settings.ts`
Test: `tests/app/admin-settings-notification-ui.test.ts`

- [ ] **Step 1: 先为页面源码增加失败测试，约束测试发信区域结构**

```ts
it('renders a notification test email section that uses saved recipients', () => {
  const source = readFileSync(resolve(process.cwd(), 'app/pages/admin/settings.vue'), 'utf8');

  expect(source).toContain('测试发信');
  expect(source).toContain('savedSnapshot.notification.adminRecipients');
  expect(source).toContain('发送测试邮件');
  expect(source).toContain('最近一次保存的配置');
  expect(source).toContain('/api/admin/settings/notification/test');
});
```

- [ ] **Step 2: 运行页面测试并确认失败**

Run: `pnpm vitest run tests/app/admin-settings-notification-ui.test.ts`
Expected: `FAIL`，提示新增文案或接口路径尚未出现。

- [ ] **Step 3: 在后台设置页中实现测试发信状态、校验与提交逻辑**

```ts
const testEmailRecipient = ref('');
const testEmailErrors = ref<NotificationFormErrors>({});
const testEmailState = ref<'idle' | 'sending' | 'success' | 'error'>('idle');
const testEmailMessage = ref('');

const savedNotificationRecipients = computed(() =>
  savedSnapshot.value.notification.adminRecipients.map(item => item.trim()).filter(Boolean),
);

async function sendNotificationTestEmailRequest() {
  testEmailErrors.value = validateNotificationTestEmailForm({
    recipient: testEmailRecipient.value,
    availableRecipients: savedNotificationRecipients.value,
  });

  if (Object.keys(testEmailErrors.value).length) {
    testEmailState.value = 'error';
    return;
  }

  testEmailState.value = 'sending';
  const response = await $fetch<{ message: string }>('/api/admin/settings/notification/test', {
    method: 'POST',
    body: { recipient: testEmailRecipient.value },
  });
  testEmailState.value = 'success';
  testEmailMessage.value = response.message;
}
```

- [ ] **Step 4: 在模板中增加测试发信卡片与禁用提示**

```vue
<article class="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
  <h3 class="text-sm font-bold text-slate-900 dark:text-white">测试发信</h3>
  <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
    当前测试邮件使用最近一次保存的配置，当前编辑中的修改内容不会参与发送。
  </p>
  <select v-model="testEmailRecipient">
    <option value="">请选择已保存管理员邮箱</option>
    <option v-for="recipient in savedNotificationRecipients" :key="recipient" :value="recipient">{{ recipient }}</option>
  </select>
  <button type="button" :disabled="isTestEmailActionDisabled" @click="sendNotificationTestEmailRequest">
    {{ testEmailState === 'sending' ? '发送中…' : '发送测试邮件' }}
  </button>
</article>
```

- [ ] **Step 5: 重新运行页面测试并确认通过**

Run: `pnpm vitest run tests/app/admin-settings-notification-ui.test.ts`
Expected: `PASS`。

### Task 4: 回归测试与收尾验证

**Files:**
Create: 无
Modify: 视前面任务实际调整
Test: `tests/app/notification-form.test.ts`, `tests/app/admin-settings-notification-ui.test.ts`, `tests/server/services/notification-delivery.service.test.ts`

- [ ] **Step 1: 运行前端相关测试集合**

Run: `pnpm vitest run tests/app/notification-form.test.ts tests/app/admin-settings-notification-ui.test.ts`
Expected: `PASS`。

- [ ] **Step 2: 运行服务端相关测试集合**

Run: `pnpm vitest run tests/server/services/notification-delivery.service.test.ts tests/server/site-settings-notification-persistence.test.ts`
Expected: `PASS`。

- [ ] **Step 3: 运行一轮聚合验证，确认功能与现有通知能力一起通过**

Run: `pnpm vitest run tests/app/notification-module-config.test.ts tests/server/plugins/notification-center.test.ts tests/server/services/notification-event.service.test.ts tests/server/services/notification-event-integration.test.ts`
Expected: `PASS`。

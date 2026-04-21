# 通知配置测试发信设计

## 目标

在后台设置页的邮件通知页签中增加测试发信能力，使用最近一次已保存的通知配置，向一个已保存的管理员收件邮箱发送测试邮件。

本次设计只覆盖管理员测试发信与现有待审核提醒能力，访客审核状态更新继续通过站内页面呈现。

## 设计范围

本次设计覆盖以下位置：

1. `modules/notification-center/module.ts`
2. `modules/notification-center/runtime/plugin.ts`
3. `app/pages/admin/settings.vue`
4. `app/utils/notification-form.ts`
5. `app/types/admin-settings.ts`
6. `server/api/admin/settings/notification/test.post.ts`
7. `server/services/notification-delivery.service.ts`
8. `server/services/notification-event.service.ts`
9. `server/services/site-settings.service.ts`
10. `tests/app/admin-settings-notification-ui.test.ts`
11. `tests/app/notification-form.test.ts`
12. `tests/server/services/notification-delivery.service.test.ts`

数据库表结构维持现状，测试发信复用现有通知投递记录表。

## 核心方案

沿用当前 `notification-center` 模块作为通知能力入口，在现有通知投递服务中扩展一条“管理员手动测试发信”分支。

运行期业务事件仍然通过 `Nitro` hook 进入 `modules/notification-center/runtime/plugin.ts`，由模块监听评论待审核和留言待审核事件后调用投递服务。测试发信属于后台管理动作，不通过运行期业务 hook 触发，而是由管理员接口直接调用通知投递服务中的测试发信方法。

这样处理后，模块边界保持清晰：模块继续负责事件注册，服务继续负责读取配置、组织邮件内容、写入投递记录与实际发信。后续新增新的管理员通知类型时，可以继续复用这一结构。

## 模块与事件结构

### Nuxt 模块职责

`modules/notification-center` 保持当前职责：

1. 注册运行期通知事件监听器
2. 将评论待审核、留言待审核事件交给通知投递服务处理
3. 记录发送失败日志

测试发信能力不需要增加新的模块注册逻辑，因为它不依赖运行期事件订阅。

### 自定义事件策略

现有业务事件继续保留：

1. `blog:comment:created`
2. `blog:guestbook:created`

投递阶段事件继续复用：

1. `notify:delivery:queued`
2. `notify:delivery:sent`
3. `notify:delivery:failed`

测试发信写入投递记录时新增专用事件名 `system:notification:test`，这个值用于记录来源，不新增新的 `Nitro` hook 名称。这样可以保持运行期 hook 数量稳定，同时仍然在投递记录与投递阶段事件中区分“业务通知”和“手动测试”。

## 服务端设计

### 管理员接口

新增接口：

```http
POST /api/admin/settings/notification/test
```

请求体：

```json
{
  "recipient": "admin@example.com"
}
```

接口流程如下：

1. 读取最近一次已保存的通知配置
2. 校验目标邮箱必须属于已保存的 `adminRecipients`
3. 校验已保存 SMTP 主机、端口、用户名、发件邮箱、已保存口令是否完整
4. 调用通知投递服务发送测试邮件
5. 返回成功消息或校验错误消息

### 独立校验规则

测试发信使用独立校验函数，不复用 `validateNotificationSettings()`。

独立校验需要覆盖以下内容：

1. `recipient` 不能为空，且格式有效
2. `recipient` 必须存在于已保存的 `adminRecipients`
3. `smtp.host` 必须存在
4. `smtp.port` 必须为 `1` 到 `65535` 之间的整数
5. `smtp.username` 必须存在
6. `smtp.fromEmail` 必须是有效邮箱
7. `smtp.password` 必须已保存并可解密读取
8. `smtp.replyToEmail` 如果填写，格式必须有效

`notification.enabled` 与事件开关不参与测试发信判定。即使总开关关闭，只要已保存配置有效，测试发信仍可执行。

### 通知投递服务扩展

在 `server/services/notification-delivery.service.ts` 中新增测试发信方法，例如 `sendNotificationTestEmail(recipient)`。

该方法复用现有能力：

1. 读取已保存通知配置
2. 创建 SMTP 传输器
3. 组装发件人地址与回复邮箱
4. 写入投递记录
5. 更新发送成功或失败状态
6. 发出投递阶段事件

测试邮件主题使用现有主题前缀，规则如下：

```text
[主题前缀] 邮件配置测试
```

主题前缀为空时，继续回退到当前默认值 `[Blog 通知]`。

正文使用固定文本，建议包含：

1. 这是一封后台触发的测试邮件
2. 发送时间
3. 收件邮箱
4. SMTP 主机
5. 发件邮箱
6. 说明当前未保存表单修改不会参与本次发送

正文中不包含 SMTP 口令等敏感信息。

### 投递记录

测试发信继续写入 `notification_deliveries`，`eventName` 使用 `system:notification:test`。

这样可以保留以下能力：

1. 统一查看发送成功与失败记录
2. 与现有投递状态变更逻辑保持一致
3. 后续增加通知历史页面时可以复用已有数据

## 前端设计

### 设置页结构

在 `app/pages/admin/settings.vue` 的邮件通知页签中，新增一个“测试发信”卡片，放在 SMTP 配置与事件开关区域附近。

卡片包含以下内容：

1. 已保存管理员邮箱选择框
2. 提示文案，说明测试发信使用最近一次保存的配置
3. 发送按钮
4. 局部发送状态文本

选择框数据源使用 `savedSnapshot.notification.adminRecipients`，而不是当前表单中的 `form.notification.adminRecipients`。这样可以保证前端展示与服务端校验依据一致。

### 未保存修改提示

当通知表单存在未保存修改时，测试发信卡片显示固定提示：当前测试邮件使用最近一次保存的配置，当前编辑中的修改内容不会参与发送。

这个提示始终保留，避免发送结果与当前可见表单值产生理解偏差。

### 交互状态

前端需要补充以下状态：

1. 当前选中的测试收件邮箱
2. 测试发信进行中的加载状态
3. 测试发信局部错误信息
4. 测试发信完成后的反馈消息

保存按钮与测试发信按钮互相独立，互不占用加载状态。

### 禁用条件

发送按钮在以下场景保持禁用：

1. 没有已保存管理员邮箱
2. 当前没有选中收件邮箱
3. 已存在测试发信请求正在进行
4. 已保存 SMTP 配置缺少主机、端口、用户名、发件邮箱或已保存口令中的任一必填项

界面同时展示原因提示，避免只有按钮禁用而缺少解释。

## 数据流

### 正常发送流程

1. 后台页面加载设置数据，生成 `form` 与 `savedSnapshot`
2. 测试发信区域从 `savedSnapshot.notification.adminRecipients` 生成目标邮箱列表
3. 管理员选择一个已保存邮箱并提交接口请求
4. 服务端读取已保存通知配置并完成独立校验
5. 通知投递服务创建投递记录并通过 SMTP 发信
6. 投递记录更新状态，并发出 `queued`、`sent`、`failed` 事件
7. 页面展示发送结果

### 失败处理

以下情况返回明确错误消息：

1. 目标邮箱不在已保存管理员列表中
2. 已保存 SMTP 配置不完整
3. 已保存口令为空或无法读取
4. SMTP 发信报错

前端保留当前表单内容，不回滚编辑状态。测试发信失败不影响设置保存功能。

## 测试范围

### 服务端测试

1. 已保存配置完整时，测试邮件发送成功
2. 通知总开关关闭时，测试邮件仍然发送成功
3. 目标邮箱不在已保存管理员列表中时返回校验错误
4. 已保存 SMTP 口令缺失时返回校验错误
5. SMTP 报错时，投递记录被标记为失败
6. 测试发信使用 `system:notification:test` 作为投递事件名

### 前端测试

1. 页面展示已保存管理员邮箱选择框
2. 当前表单存在未保存修改时，提示文案仍然强调发送基于已保存配置
3. 没有已保存管理员邮箱时，发送按钮禁用并显示提示
4. 发送按钮具有独立加载状态
5. 调用成功与失败时，界面反馈符合预期

### 表单校验测试

1. 测试发信未选择邮箱时返回错误
2. 已保存邮箱列表为空时返回错误
3. 已选择邮箱且存在于已保存列表中时通过校验

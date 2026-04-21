import { createError } from 'h3';
import type { SiteNotificationSettings } from '../../app/types/admin-settings';
import {
  createQueuedNotificationDeliveryRecord,
  markNotificationDeliveryAsFailed,
  markNotificationDeliveryAsSent,
} from '../repositories/notification-delivery.repository';
import {
  emitDeliveryFailed,
  emitDeliveryQueued,
  emitDeliverySent,
  NOTIFICATION_HOOK_NAMES,
  type GuestbookCreatedEventPayload,
  type GuestbookReviewedEventPayload,
  type NotificationDeliveryFailedEventPayload,
  type NotificationDeliveryQueuedEventPayload,
  type NotificationDeliverySentEventPayload,
  type NotificationRuntimeHookPayloadMap,
  type PostCommentCreatedEventPayload,
  type PostCommentReviewedEventPayload,
} from './notification-event.service';
import { readNotificationModuleRuntimeSettings } from './notification-module.service';
import { isNotificationModuleEnabled } from './module-center.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOTIFICATION_TEST_EVENT_NAME = 'system:notification:test';

type NotificationEventName =
  | typeof NOTIFICATION_HOOK_NAMES.postCommentCreated
  | typeof NOTIFICATION_HOOK_NAMES.postCommentReviewed
  | typeof NOTIFICATION_HOOK_NAMES.guestbookCreated
  | typeof NOTIFICATION_HOOK_NAMES.guestbookReviewed;

type NotificationEventPayload = NotificationRuntimeHookPayloadMap[NotificationEventName];

interface MailTransport {
  sendMail: (message: Record<string, unknown>) => Promise<unknown>;
}

interface NotificationMessage {
  subject: string;
  bodyText: string;
  recipients: string[];
}

interface NotificationDeliveryServiceDependencies {
  readNotificationSettings?: () => Promise<SiteNotificationSettings>;
  isNotificationModuleEnabled?: () => Promise<boolean> | boolean;
  createQueuedNotificationDeliveryRecord?: typeof createQueuedNotificationDeliveryRecord;
  markNotificationDeliveryAsSent?: typeof markNotificationDeliveryAsSent;
  markNotificationDeliveryAsFailed?: typeof markNotificationDeliveryAsFailed;
  createTransport?: (options: Record<string, unknown>) => Promise<MailTransport> | MailTransport;
  emitDeliveryQueued?: (payload: NotificationDeliveryQueuedEventPayload) => Promise<void> | void;
  emitDeliverySent?: (payload: NotificationDeliverySentEventPayload) => Promise<void> | void;
  emitDeliveryFailed?: (payload: NotificationDeliveryFailedEventPayload) => Promise<void> | void;
  now?: () => Date;
}

function normalizeSubjectPrefix(value: string) {
  return value.trim() || '[Blog 通知]';
}

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

function shouldDeliverEvent(settings: SiteNotificationSettings, eventName: NotificationEventName) {
  if (!settings.enabled) {
    return false;
  }

  if (eventName === NOTIFICATION_HOOK_NAMES.postCommentCreated) {
    return settings.events.postCommentCreated;
  }

  if (eventName === NOTIFICATION_HOOK_NAMES.postCommentReviewed) {
    return settings.events.postCommentReply;
  }

  if (eventName === NOTIFICATION_HOOK_NAMES.guestbookCreated) {
    return settings.events.guestbookCreated;
  }

  return false;
}

function createPostCommentCreatedMessage(
  settings: SiteNotificationSettings,
  payload: PostCommentCreatedEventPayload,
): NotificationMessage {
  const subjectPrefix = normalizeSubjectPrefix(settings.subjectPrefix);

  return {
    recipients: [...settings.adminRecipients],
    subject: `${subjectPrefix} 新评论待审核：${payload.postTitle}`,
    bodyText: [
      '收到新的文章评论，当前状态为待审核。',
      '',
      `文章标题：${payload.postTitle}`,
      `评论作者：${payload.authorName}`,
      `作者邮箱：${payload.authorEmail}`,
      `地区：${payload.authorRegion}`,
      `提交时间：${payload.submittedAt}`,
      '',
      '评论内容：',
      payload.content,
    ].join('\n'),
  };
}

function createGuestbookCreatedMessage(
  settings: SiteNotificationSettings,
  payload: GuestbookCreatedEventPayload,
): NotificationMessage {
  const subjectPrefix = normalizeSubjectPrefix(settings.subjectPrefix);

  return {
    recipients: [...settings.adminRecipients],
    subject: `${subjectPrefix} 新留言待审核`,
    bodyText: [
      '收到新的留言，当前状态为待审核。',
      '',
      `留言作者：${payload.authorName}`,
      `作者邮箱：${payload.authorEmail}`,
      `地区：${payload.authorRegion}`,
      `提交时间：${payload.submittedAt}`,
      '',
      '留言内容：',
      payload.content,
    ].join('\n'),
  };
}

function createPostCommentReplyMessage(
  settings: SiteNotificationSettings,
  payload: PostCommentReviewedEventPayload,
): NotificationMessage | null {
  const normalizedParentAuthorEmail = payload.parentAuthorEmail.trim();

  if (!payload.parentId || payload.status !== 'approved' || payload.previousStatus === 'approved') {
    return null;
  }

  if (!isValidEmail(normalizedParentAuthorEmail)) {
    return null;
  }

  const subjectPrefix = normalizeSubjectPrefix(settings.subjectPrefix);

  return {
    recipients: [normalizedParentAuthorEmail],
    subject: `${subjectPrefix} 评论收到新回复：${payload.postTitle}`,
    bodyText: [
      '文章评论收到新的回复，当前已通过审核。',
      '',
      `文章标题：${payload.postTitle}`,
      `回复作者：${payload.authorName}`,
      `作者邮箱：${payload.authorEmail}`,
      `地区：${payload.authorRegion}`,
      `提交时间：${payload.submittedAt}`,
      `审核时间：${payload.reviewedAt ?? ''}`,
      '',
      '回复内容：',
      payload.content,
    ].join('\n'),
  };
}

function createNotificationMessage(
  settings: SiteNotificationSettings,
  eventName: NotificationEventName,
  payload: NotificationEventPayload,
) {
  if (eventName === NOTIFICATION_HOOK_NAMES.postCommentCreated) {
    return createPostCommentCreatedMessage(settings, payload as PostCommentCreatedEventPayload);
  }

  if (eventName === NOTIFICATION_HOOK_NAMES.postCommentReviewed) {
    return createPostCommentReplyMessage(settings, payload as PostCommentReviewedEventPayload);
  }

  if (eventName === NOTIFICATION_HOOK_NAMES.guestbookCreated) {
    return createGuestbookCreatedMessage(settings, payload as GuestbookCreatedEventPayload);
  }

  return null;
}

function createNotificationTestMessage(
  settings: SiteNotificationSettings,
  recipient: string,
  triggeredAt: Date,
): NotificationMessage {
  const subjectPrefix = normalizeSubjectPrefix(settings.subjectPrefix);

  return {
    recipients: [recipient],
    subject: `${subjectPrefix} 邮件配置测试`,
    bodyText: [
      '这是一封后台触发的测试邮件，用于确认通知邮件配置可正常发送。',
      '',
      `发送时间：${triggeredAt.toISOString()}`,
      `收件邮箱：${recipient}`,
      `SMTP 主机：${settings.smtp.host.trim()}`,
      `发件邮箱：${settings.smtp.fromEmail.trim()}`,
      '当前测试邮件使用最近一次保存的配置，当前未保存修改不会参与本次发送。',
    ].join('\n'),
  };
}

function validateNotificationTestSettings(settings: SiteNotificationSettings) {
  if (!settings.smtp.host.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: '测试发信前必须先保存 SMTP 主机',
    });
  }

  if (!Number.isInteger(settings.smtp.port) || settings.smtp.port < 1 || settings.smtp.port > 65535) {
    throw createError({
      statusCode: 400,
      statusMessage: 'SMTP 端口需填写 1 到 65535 之间的整数',
    });
  }

  if (!settings.smtp.username.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: '测试发信前必须先保存 SMTP 用户名',
    });
  }

  if (!settings.smtp.fromEmail.trim() || !EMAIL_PATTERN.test(settings.smtp.fromEmail.trim())) {
    throw createError({
      statusCode: 400,
      statusMessage: '发件邮箱格式无效',
    });
  }

  if (settings.smtp.replyToEmail.trim() && !EMAIL_PATTERN.test(settings.smtp.replyToEmail.trim())) {
    throw createError({
      statusCode: 400,
      statusMessage: '回复邮箱格式无效',
    });
  }

  if (!settings.smtp.password.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: '测试发信前必须先保存 SMTP 密码',
    });
  }
}

function validateNotificationTestRecipient(settings: SiteNotificationSettings, recipient: string) {
  const normalizedRecipient = recipient.trim();
  const savedRecipients = settings.adminRecipients
    .map((item) => item.trim())
    .filter(Boolean);

  if (!normalizedRecipient) {
    throw createError({
      statusCode: 400,
      statusMessage: '请选择一个已保存的管理员邮箱',
    });
  }

  if (!EMAIL_PATTERN.test(normalizedRecipient)) {
    throw createError({
      statusCode: 400,
      statusMessage: '测试收件邮箱格式无效',
    });
  }

  if (!savedRecipients.includes(normalizedRecipient)) {
    throw createError({
      statusCode: 400,
      statusMessage: '测试收件邮箱必须来自已保存的管理员邮箱',
    });
  }

  return normalizedRecipient;
}

async function defaultCreateTransport(options: Record<string, unknown>) {
  const nodemailer = await import('nodemailer');
  return nodemailer.createTransport(options);
}

function createMailFrom(settings: SiteNotificationSettings) {
  if (settings.smtp.fromName.trim()) {
    return `"${settings.smtp.fromName.trim()}" <${settings.smtp.fromEmail.trim()}>`;
  }

  return settings.smtp.fromEmail.trim();
}

export function createNotificationDeliveryService(dependencies: NotificationDeliveryServiceDependencies = {}) {
  const {
    readNotificationSettings: readNotificationSettingsImpl = readNotificationModuleRuntimeSettings,
    isNotificationModuleEnabled: isNotificationModuleEnabledImpl = isNotificationModuleEnabled,
    createQueuedNotificationDeliveryRecord: createQueuedNotificationDeliveryRecordImpl = createQueuedNotificationDeliveryRecord,
    markNotificationDeliveryAsSent: markNotificationDeliveryAsSentImpl = markNotificationDeliveryAsSent,
    markNotificationDeliveryAsFailed: markNotificationDeliveryAsFailedImpl = markNotificationDeliveryAsFailed,
    createTransport: createTransportImpl = defaultCreateTransport,
    emitDeliveryQueued: emitDeliveryQueuedImpl = emitDeliveryQueued,
    emitDeliverySent: emitDeliverySentImpl = emitDeliverySent,
    emitDeliveryFailed: emitDeliveryFailedImpl = emitDeliveryFailed,
    now = () => new Date(),
  } = dependencies;

  async function deliverMessage(
    settings: SiteNotificationSettings,
    eventName: string,
    message: NotificationMessage,
    payload: Record<string, unknown>,
    queuedAt: Date,
  ) {
    const deliveryRecord = await createQueuedNotificationDeliveryRecordImpl({
      eventName,
      recipients: message.recipients,
      subject: message.subject,
      bodyText: message.bodyText,
      payload,
      queuedAt,
    });

    const queuedPayload = {
      deliveryId: deliveryRecord.id,
      eventName,
      recipients: message.recipients,
      subject: message.subject,
      queuedAt: deliveryRecord.queuedAt.toISOString(),
    } satisfies NotificationDeliveryQueuedEventPayload;

    await emitDeliveryQueuedImpl(queuedPayload);

    try {
      const transport = await createTransportImpl({
        host: settings.smtp.host,
        port: settings.smtp.port,
        secure: settings.smtp.secure,
        auth: {
          user: settings.smtp.username,
          pass: settings.smtp.password,
        },
      });

      await transport.sendMail({
        from: createMailFrom(settings),
        to: message.recipients,
        subject: message.subject,
        text: message.bodyText,
        replyTo: settings.smtp.replyToEmail.trim() || undefined,
      });

      const sentAt = now();
      await markNotificationDeliveryAsSentImpl(deliveryRecord.id, sentAt);
      await emitDeliverySentImpl({
        ...queuedPayload,
        sentAt: sentAt.toISOString(),
      });
    }
    catch (error) {
      const failedAt = now();
      const errorMessage = error instanceof Error ? error.message : String(error);

      await markNotificationDeliveryAsFailedImpl(deliveryRecord.id, errorMessage, failedAt);
      await emitDeliveryFailedImpl({
        ...queuedPayload,
        failedAt: failedAt.toISOString(),
        errorMessage,
      });

      throw error;
    }
  }

  return {
    async deliverNotificationEvent(eventName: NotificationEventName, payload: NotificationEventPayload) {
      const moduleEnabled = await isNotificationModuleEnabledImpl();

      if (!moduleEnabled) {
        return;
      }

      const settings = await readNotificationSettingsImpl();

      if (!shouldDeliverEvent(settings, eventName)) {
        return;
      }

      const message = createNotificationMessage(settings, eventName, payload);

      if (!message || !message.recipients.length || !settings.smtp.password.trim()) {
        return;
      }

      const queuedAt = now();
      await deliverMessage(
        settings,
        eventName,
        message,
        payload as unknown as Record<string, unknown>,
        queuedAt,
      );
    },
    async sendNotificationTestEmail(recipient: string) {
      const settings = await readNotificationSettingsImpl();
      validateNotificationTestSettings(settings);
      const normalizedRecipient = validateNotificationTestRecipient(settings, recipient);
      const queuedAt = now();
      const message = createNotificationTestMessage(settings, normalizedRecipient, queuedAt);

      await deliverMessage(
        settings,
        NOTIFICATION_TEST_EVENT_NAME,
        message,
        {
          recipient: normalizedRecipient,
          triggeredAt: queuedAt.toISOString(),
        },
        queuedAt,
      );
    },
  };
}

const notificationDeliveryService = createNotificationDeliveryService();

export const deliverNotificationEvent = notificationDeliveryService.deliverNotificationEvent;
export const sendNotificationTestEmail = notificationDeliveryService.sendNotificationTestEmail;

import type { PostCommentStatus } from '../../shared/types/post-comment';
import type { GuestbookStatusUpdateInput } from '../../shared/types/guestbook';

export const NOTIFICATION_HOOK_NAMES = {
  postCommentCreated: 'blog:comment:created',
  postCommentReviewed: 'blog:comment:reviewed',
  guestbookCreated: 'blog:guestbook:created',
  guestbookReviewed: 'blog:guestbook:reviewed',
  deliveryQueued: 'notify:delivery:queued',
  deliverySent: 'notify:delivery:sent',
  deliveryFailed: 'notify:delivery:failed',
} as const;

export interface PostCommentCreatedEventPayload {
  id: string;
  postId: number;
  postTitle: string;
  parentId: string | null;
  authorName: string;
  authorEmail: string;
  authorRegion: string;
  content: string;
  status: PostCommentStatus;
  submittedAt: string;
}

export interface PostCommentReviewedEventPayload extends PostCommentCreatedEventPayload {
  parentAuthorEmail: string;
  previousStatus: PostCommentStatus;
  reviewedAt: string | null;
}

export interface GuestbookCreatedEventPayload {
  id: string;
  parentId: string | null;
  authorName: string;
  authorEmail: string;
  authorRegion: string;
  content: string;
  status: GuestbookStatusUpdateInput['status'] | 'pending';
  submittedAt: string;
}

export interface GuestbookReviewedEventPayload extends GuestbookCreatedEventPayload {
  previousStatus: GuestbookStatusUpdateInput['status'] | 'pending';
  reviewedAt: string | null;
}

export interface NotificationDeliveryQueuedEventPayload {
  deliveryId: string;
  eventName: string;
  recipients: string[];
  subject: string;
  queuedAt: string;
}

export interface NotificationDeliverySentEventPayload extends NotificationDeliveryQueuedEventPayload {
  sentAt: string;
}

export interface NotificationDeliveryFailedEventPayload extends NotificationDeliveryQueuedEventPayload {
  failedAt: string;
  errorMessage: string;
}

export interface NotificationRuntimeHookPayloadMap {
  [NOTIFICATION_HOOK_NAMES.postCommentCreated]: PostCommentCreatedEventPayload;
  [NOTIFICATION_HOOK_NAMES.postCommentReviewed]: PostCommentReviewedEventPayload;
  [NOTIFICATION_HOOK_NAMES.guestbookCreated]: GuestbookCreatedEventPayload;
  [NOTIFICATION_HOOK_NAMES.guestbookReviewed]: GuestbookReviewedEventPayload;
  [NOTIFICATION_HOOK_NAMES.deliveryQueued]: NotificationDeliveryQueuedEventPayload;
  [NOTIFICATION_HOOK_NAMES.deliverySent]: NotificationDeliverySentEventPayload;
  [NOTIFICATION_HOOK_NAMES.deliveryFailed]: NotificationDeliveryFailedEventPayload;
}

export type NotificationHookName = keyof NotificationRuntimeHookPayloadMap;

interface NotificationHookCaller<PayloadMap> {
  callHook<Name extends keyof PayloadMap & string>(
    name: Name,
    payload: PayloadMap[Name],
  ): Promise<unknown>;
}

interface NotificationEventServiceDependencies {
  callHook?: <Name extends NotificationHookName>(
    name: Name,
    payload: NotificationRuntimeHookPayloadMap[Name],
  ) => Promise<void> | void;
}

function defaultCallHook<Name extends NotificationHookName>(
  name: Name,
  payload: NotificationRuntimeHookPayloadMap[Name],
) {
  const notificationHooks = useNitroApp().hooks as unknown as NotificationHookCaller<NotificationRuntimeHookPayloadMap>;
  return notificationHooks.callHook(name, payload);
}

export function createNotificationEventService(dependencies: NotificationEventServiceDependencies = {}) {
  const { callHook = defaultCallHook } = dependencies;

  return {
    async emitPostCommentCreated(payload: PostCommentCreatedEventPayload) {
      await callHook(NOTIFICATION_HOOK_NAMES.postCommentCreated, payload);
    },
    async emitPostCommentReviewed(payload: PostCommentReviewedEventPayload) {
      await callHook(NOTIFICATION_HOOK_NAMES.postCommentReviewed, payload);
    },
    async emitGuestbookCreated(payload: GuestbookCreatedEventPayload) {
      await callHook(NOTIFICATION_HOOK_NAMES.guestbookCreated, payload);
    },
    async emitGuestbookReviewed(payload: GuestbookReviewedEventPayload) {
      await callHook(NOTIFICATION_HOOK_NAMES.guestbookReviewed, payload);
    },
    async emitDeliveryQueued(payload: NotificationDeliveryQueuedEventPayload) {
      await callHook(NOTIFICATION_HOOK_NAMES.deliveryQueued, payload);
    },
    async emitDeliverySent(payload: NotificationDeliverySentEventPayload) {
      await callHook(NOTIFICATION_HOOK_NAMES.deliverySent, payload);
    },
    async emitDeliveryFailed(payload: NotificationDeliveryFailedEventPayload) {
      await callHook(NOTIFICATION_HOOK_NAMES.deliveryFailed, payload);
    },
  };
}

const notificationEventService = createNotificationEventService();

export const emitPostCommentCreated = notificationEventService.emitPostCommentCreated;
export const emitPostCommentReviewed = notificationEventService.emitPostCommentReviewed;
export const emitGuestbookCreated = notificationEventService.emitGuestbookCreated;
export const emitGuestbookReviewed = notificationEventService.emitGuestbookReviewed;
export const emitDeliveryQueued = notificationEventService.emitDeliveryQueued;
export const emitDeliverySent = notificationEventService.emitDeliverySent;
export const emitDeliveryFailed = notificationEventService.emitDeliveryFailed;

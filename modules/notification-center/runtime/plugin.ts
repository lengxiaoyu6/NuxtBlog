import { deliverNotificationEvent } from '../../../server/services/notification-delivery.service';
import {
  NOTIFICATION_HOOK_NAMES,
  type NotificationRuntimeHookPayloadMap,
} from '../../../server/services/notification-event.service';

const NOTIFICATION_EVENT_NAMES = [
  NOTIFICATION_HOOK_NAMES.postCommentCreated,
  NOTIFICATION_HOOK_NAMES.postCommentReviewed,
  NOTIFICATION_HOOK_NAMES.guestbookCreated,
  NOTIFICATION_HOOK_NAMES.guestbookReviewed,
] as const;

type NotificationEventName = typeof NOTIFICATION_EVENT_NAMES[number];
type NotificationEventPayloadMap = Pick<NotificationRuntimeHookPayloadMap, NotificationEventName>;

interface NotificationHookRegistrar<PayloadMap> {
  hook<Name extends keyof PayloadMap & string>(
    name: Name,
    handler: (payload: PayloadMap[Name]) => Promise<void> | void,
  ): () => void;
}

function useNotificationEventHooks() {
  return useNitroApp().hooks as unknown as NotificationHookRegistrar<NotificationEventPayloadMap>;
}

function registerNotificationHook<Name extends NotificationEventName>(
  eventName: Name,
) {
  const notificationHooks = useNotificationEventHooks();

  notificationHooks.hook(eventName, async (payload: NotificationEventPayloadMap[Name]) => {
    try {
      await deliverNotificationEvent(eventName, payload);
    }
    catch (error) {
      console.error('[notification-center] delivery failed', {
        eventName,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

export default defineNitroPlugin(() => {
  for (const eventName of NOTIFICATION_EVENT_NAMES) {
    registerNotificationHook(eventName);
  }
});

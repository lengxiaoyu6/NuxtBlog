import type { NotificationRuntimeHookPayloadMap } from '../server/services/notification-event.service';

type NotificationRuntimeHookHandlers = {
  [Name in keyof NotificationRuntimeHookPayloadMap]:
    (payload: NotificationRuntimeHookPayloadMap[Name]) => void | Promise<void>;
};

declare global {
  const useNitroApp: typeof import('nitropack/runtime').useNitroApp;
}

declare module 'nitropack' {
  interface NitroRuntimeHooks extends NotificationRuntimeHookHandlers {}
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks extends NotificationRuntimeHookHandlers {}
}

export {};

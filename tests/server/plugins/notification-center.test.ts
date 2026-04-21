import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { NOTIFICATION_HOOK_NAMES } from '../../../server/services/notification-event.service';

const projectRoot = process.cwd();
const pluginUrl = pathToFileURL(path.resolve(projectRoot, 'modules/notification-center/runtime/plugin.ts')).href;

const mocks = vi.hoisted(() => ({
  deliverNotificationEvent: vi.fn(),
  hook: vi.fn(),
}));

vi.mock('../../../server/services/notification-delivery.service', () => ({
  deliverNotificationEvent: mocks.deliverNotificationEvent,
}));

vi.stubGlobal('defineNitroPlugin', (plugin: unknown) => plugin);

async function loadPlugin() {
  vi.resetModules();
  const imported = await import(`${pluginUrl}?t=${Date.now()}`);
  return imported.default as () => void;
}

describe('notification center nitro plugin', () => {
  const registeredHandlers = new Map<string, (payload: unknown) => Promise<void>>();

  beforeEach(() => {
    vi.clearAllMocks();
    registeredHandlers.clear();
    mocks.hook.mockImplementation((name: string, handler: (payload: unknown) => Promise<void>) => {
      registeredHandlers.set(name, handler);
    });
    vi.stubGlobal('useNitroApp', () => ({
      hooks: {
        hook: mocks.hook,
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers notification event hooks and forwards payloads to the delivery service', async () => {
    const plugin = await loadPlugin();

    plugin();

    expect(mocks.hook).toHaveBeenCalledTimes(4);
    expect(registeredHandlers.has(NOTIFICATION_HOOK_NAMES.postCommentCreated)).toBe(true);
    expect(registeredHandlers.has(NOTIFICATION_HOOK_NAMES.postCommentReviewed)).toBe(true);
    expect(registeredHandlers.has(NOTIFICATION_HOOK_NAMES.guestbookCreated)).toBe(true);
    expect(registeredHandlers.has(NOTIFICATION_HOOK_NAMES.guestbookReviewed)).toBe(true);

    const payload = {
      id: 'comment-1',
      postId: 7,
      postTitle: '测试文章',
      parentId: null,
      authorName: '测试用户',
      authorEmail: 'author@example.com',
      authorRegion: '广东',
      content: '评论内容',
      status: 'pending',
      submittedAt: '2026-04-20T11:59:00.000Z',
    };

    await registeredHandlers.get(NOTIFICATION_HOOK_NAMES.postCommentCreated)?.(payload);

    expect(mocks.deliverNotificationEvent).toHaveBeenCalledWith(
      NOTIFICATION_HOOK_NAMES.postCommentCreated,
      payload,
    );
  });
});

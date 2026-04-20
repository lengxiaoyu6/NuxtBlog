import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '../..');

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8');
}

describe('请求错误提示提取接入范围', () => {
  it('提交与后台保存相关页面应统一改用 resolveRequestErrorMessage', () => {
    const filesRequiringSharedResolver = [
      'app/components/CommentSection.vue',
      'app/pages/links.vue',
      'app/pages/admin/comments.vue',
      'app/pages/admin/pages/about.vue',
      'app/pages/admin/pages/guestbook.vue',
      'app/pages/admin/pages/links.vue',
      'app/pages/admin/pages/projects.vue',
      'app/pages/admin/settings.vue',
      'app/pages/admin/login.vue',
      'app/pages/admin/password-setup.vue',
      'app/pages/admin/categories.vue',
      'app/pages/admin/posts/new.vue',
      'app/pages/admin/posts/index.vue',
      'app/pages/post/[identifier].vue',
      'app/composables/useAdminMediaLibrary.ts',
    ];

    for (const relativePath of filesRequiringSharedResolver) {
      const source = readProjectFile(relativePath);
      expect(source, `${relativePath} 应引入共享请求错误提示工具`).toContain('resolveRequestErrorMessage');
    }
  });

  it('应用层代码中不应继续保留旧的错误提取写法', () => {
    const legacyPatterns = [
      'error instanceof Error ? error.message',
      'function getRequestErrorMessage(',
      'function resolveRequestError(',
      'function resolveLoginError(',
      'function extractUploadErrorMessage(',
    ];

    const appFiles = [
      'app/components/CommentSection.vue',
      'app/pages/links.vue',
      'app/pages/admin/comments.vue',
      'app/pages/admin/pages/about.vue',
      'app/pages/admin/pages/guestbook.vue',
      'app/pages/admin/pages/links.vue',
      'app/pages/admin/pages/projects.vue',
      'app/pages/admin/settings.vue',
      'app/pages/admin/login.vue',
      'app/pages/admin/password-setup.vue',
      'app/pages/admin/categories.vue',
      'app/pages/admin/posts/new.vue',
      'app/pages/admin/posts/index.vue',
      'app/pages/post/[identifier].vue',
      'app/composables/useAdminMediaLibrary.ts',
    ];

    for (const relativePath of appFiles) {
      const source = readProjectFile(relativePath);

      for (const pattern of legacyPatterns) {
        expect(source, `${relativePath} 仍包含旧写法：${pattern}`).not.toContain(pattern);
      }
    }
  });
});

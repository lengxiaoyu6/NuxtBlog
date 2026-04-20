import { describe, expect, it } from 'vitest';

async function loadResolveRequestErrorMessage() {
  try {
    const module = await import('~/utils/request-error');
    return module.resolveRequestErrorMessage;
  }
  catch {
    return undefined;
  }
}

describe('resolveRequestErrorMessage', () => {
  it('优先返回 error.data.statusMessage，避免退化成接口地址与状态码', async () => {
    const resolveRequestErrorMessage = await loadResolveRequestErrorMessage();

    expect(typeof resolveRequestErrorMessage).toBe('function');

    if (typeof resolveRequestErrorMessage !== 'function') {
      return;
    }

    const fetchError = {
      message: '[POST] "/api/guestbook/entries": 400 昵称长度需在 2 到 24 个字符之间',
      statusMessage: '400 Bad Request',
      data: {
        statusCode: 400,
        statusMessage: ' 昵称长度需在 2 到 24 个字符之间 ',
      },
    };

    expect(resolveRequestErrorMessage(fetchError, '留言提交失败')).toBe('昵称长度需在 2 到 24 个字符之间');
  });

  it('在缺少 statusMessage 时回退到 error.data.message', async () => {
    const resolveRequestErrorMessage = await loadResolveRequestErrorMessage();

    expect(typeof resolveRequestErrorMessage).toBe('function');

    if (typeof resolveRequestErrorMessage !== 'function') {
      return;
    }

    expect(resolveRequestErrorMessage({
      data: {
        message: ' 请输入有效的邮箱地址 ',
      },
    }, '评论提交失败')).toBe('请输入有效的邮箱地址');
  });

  it('继续回退到顶层 statusMessage 与 message', async () => {
    const resolveRequestErrorMessage = await loadResolveRequestErrorMessage();

    expect(typeof resolveRequestErrorMessage).toBe('function');

    if (typeof resolveRequestErrorMessage !== 'function') {
      return;
    }

    expect(resolveRequestErrorMessage({
      statusMessage: ' 友链保存失败，请检查输入内容 ',
    }, '友链保存失败')).toBe('友链保存失败，请检查输入内容');

    expect(resolveRequestErrorMessage({
      message: ' 登录失败，请稍后重试 ',
    }, '登录失败')).toBe('登录失败，请稍后重试');
  });

  it('跳过空字符串并返回回退文案', async () => {
    const resolveRequestErrorMessage = await loadResolveRequestErrorMessage();

    expect(typeof resolveRequestErrorMessage).toBe('function');

    if (typeof resolveRequestErrorMessage !== 'function') {
      return;
    }

    expect(resolveRequestErrorMessage({
      data: {
        statusMessage: '   ',
        message: '',
      },
      statusMessage: ' ',
      message: '',
    }, '设置保存失败')).toBe('设置保存失败');

    expect(resolveRequestErrorMessage(null, '评论状态更新失败')).toBe('评论状态更新失败');
  });
});

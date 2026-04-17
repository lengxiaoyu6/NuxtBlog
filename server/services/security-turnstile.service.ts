import { createError } from 'h3';

interface TurnstileApiResponse {
  success?: boolean;
  'error-codes'?: string[];
}

export function createTurnstileVerificationService(input: {
  fetchImpl?: typeof fetch;
}) {
  const fetchImpl = input.fetchImpl ?? fetch;

  return {
    async verifyToken(payload: {
      enabled: boolean;
      secretKey: string;
      token: string;
      remoteIp?: string;
    }) {
      if (!payload.enabled) {
        return {
          ok: true,
          skipped: true,
        };
      }

      const secretKey = payload.secretKey.trim();
      const token = payload.token.trim();

      if (!secretKey) {
        throw createError({
          statusCode: 503,
          statusMessage: '人机校验服务尚未完成配置',
        });
      }

      if (!token) {
        throw createError({
          statusCode: 400,
          statusMessage: '请先完成人机校验',
        });
      }

      const body = new URLSearchParams({
        secret: secretKey,
        response: token,
      });

      if (payload.remoteIp?.trim()) {
        body.set('remoteip', payload.remoteIp.trim());
      }

      const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!response.ok) {
        throw createError({
          statusCode: 502,
          statusMessage: '人机校验服务响应异常',
        });
      }

      const result = await response.json() as TurnstileApiResponse;

      if (!result.success) {
        const errorCodes = Array.isArray(result['error-codes']) ? result['error-codes'].join(', ') : '';
        throw createError({
          statusCode: 400,
          statusMessage: errorCodes ? `人机校验未通过：${errorCodes}` : '人机校验未通过',
        });
      }

      return {
        ok: true,
      };
    },
  };
}

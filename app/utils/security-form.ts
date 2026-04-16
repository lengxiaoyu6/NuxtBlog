import type { SecurityPublicConfig, SecurityRateLimitSettings, SiteSecuritySettings } from '~~/shared/types/security';

export type CaptchaScene = 'login' | 'comment' | 'guestbook' | 'linkApplication';

export type SecurityFormErrors = Record<string, string>;

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

function validateRateLimitSettings(
  errors: SecurityFormErrors,
  keyPrefix: string,
  label: string,
  input: SecurityRateLimitSettings,
) {
  if (!isPositiveInteger(input.windowSeconds)) {
    errors[`${keyPrefix}.rateLimit.windowSeconds`] = `${label}的时间窗口必须为正整数`;
  }

  if (!isPositiveInteger(input.maxPerIp)) {
    errors[`${keyPrefix}.rateLimit.maxPerIp`] = `${label}的 IP 次数上限必须为正整数`;
  }

  if (!isPositiveInteger(input.maxPerSession)) {
    errors[`${keyPrefix}.rateLimit.maxPerSession`] = `${label}的会话次数上限必须为正整数`;
  }

  if (isPositiveInteger(input.maxPerIp)
    && isPositiveInteger(input.maxPerSession)
    && input.maxPerSession > input.maxPerIp) {
    errors[`${keyPrefix}.rateLimit.maxPerSession`] = `${label}的会话次数上限不能大于 IP 次数上限`;
  }
}

export function isCaptchaRequired(scene: CaptchaScene, config: SecurityPublicConfig) {
  if (scene === 'login') {
    return config.loginCaptchaEnabled;
  }

  if (scene === 'guestbook') {
    return config.guestbookCaptchaEnabled;
  }

  if (scene === 'linkApplication') {
    return config.linkApplicationCaptchaEnabled;
  }

  return config.commentCaptchaEnabled;
}

export function validateSecuritySettingsForm(input: SiteSecuritySettings): SecurityFormErrors {
  const errors: SecurityFormErrors = {};
  const captchaEnabled = input.login.captchaEnabled
    || input.comments.captchaEnabled
    || input.guestbook.captchaEnabled
    || input.linkApplications.captchaEnabled;

  if (captchaEnabled && !input.turnstileSiteKey.trim()) {
    errors.turnstileSiteKey = '启用人机校验时必须填写 Turnstile Site Key';
  }

  validateRateLimitSettings(errors, 'login', '登录限流', input.login.rateLimit);
  validateRateLimitSettings(errors, 'comments', '评论限流', input.comments.rateLimit);
  validateRateLimitSettings(errors, 'guestbook', '留言限流', input.guestbook.rateLimit);
  validateRateLimitSettings(errors, 'linkApplications', '友链申请限流', input.linkApplications.rateLimit);
  validateRateLimitSettings(errors, 'likes', '点赞限流', input.likes.rateLimit);

  if (!isPositiveInteger(input.login.maxFailures)) {
    errors['login.maxFailures'] = '登录失败次数上限必须为正整数';
  }

  if (!isPositiveInteger(input.login.cooldownSeconds)) {
    errors['login.cooldownSeconds'] = '登录冷却时间必须为正整数';
  }

  return errors;
}

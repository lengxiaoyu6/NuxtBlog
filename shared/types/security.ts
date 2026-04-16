export interface SecurityRateLimitSettings {
  windowSeconds: number;
  maxPerIp: number;
  maxPerSession: number;
}

export interface LoginSecuritySettings {
  captchaEnabled: boolean;
  rateLimit: SecurityRateLimitSettings;
  maxFailures: number;
  cooldownSeconds: number;
}

export interface PublicSubmitSecuritySettings {
  captchaEnabled: boolean;
  rateLimit: SecurityRateLimitSettings;
}

export interface LikeSecuritySettings {
  rateLimit: SecurityRateLimitSettings;
}

export interface SecuritySettings {
  login: LoginSecuritySettings;
  comments: PublicSubmitSecuritySettings;
  guestbook: PublicSubmitSecuritySettings;
  linkApplications: PublicSubmitSecuritySettings;
  likes: LikeSecuritySettings;
}

export interface SiteSecuritySettings extends SecuritySettings {
  turnstileSiteKey: string;
}

export interface SecurityPublicConfig {
  turnstileSiteKey: string;
  loginCaptchaEnabled: boolean;
  commentCaptchaEnabled: boolean;
  guestbookCaptchaEnabled: boolean;
  linkApplicationCaptchaEnabled: boolean;
}

import type { SecuritySettings, SiteSecuritySettings } from '../types/security';

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  login: {
    captchaEnabled: false,
    rateLimit: {
      windowSeconds: 300,
      maxPerIp: 12,
      maxPerSession: 6,
    },
    maxFailures: 5,
    cooldownSeconds: 900,
  },
  comments: {
    captchaEnabled: false,
    rateLimit: {
      windowSeconds: 300,
      maxPerIp: 6,
      maxPerSession: 3,
    },
  },
  guestbook: {
    captchaEnabled: false,
    rateLimit: {
      windowSeconds: 300,
      maxPerIp: 4,
      maxPerSession: 2,
    },
  },
  linkApplications: {
    captchaEnabled: false,
    rateLimit: {
      windowSeconds: 1800,
      maxPerIp: 3,
      maxPerSession: 1,
    },
  },
  likes: {
    rateLimit: {
      windowSeconds: 300,
      maxPerIp: 30,
      maxPerSession: 10,
    },
  },
};

export const DEFAULT_SITE_SECURITY_SETTINGS: SiteSecuritySettings = {
  turnstileSiteKey: '',
  login: {
    ...DEFAULT_SECURITY_SETTINGS.login,
    rateLimit: { ...DEFAULT_SECURITY_SETTINGS.login.rateLimit },
  },
  comments: {
    ...DEFAULT_SECURITY_SETTINGS.comments,
    rateLimit: { ...DEFAULT_SECURITY_SETTINGS.comments.rateLimit },
  },
  guestbook: {
    ...DEFAULT_SECURITY_SETTINGS.guestbook,
    rateLimit: { ...DEFAULT_SECURITY_SETTINGS.guestbook.rateLimit },
  },
  linkApplications: {
    ...DEFAULT_SECURITY_SETTINGS.linkApplications,
    rateLimit: { ...DEFAULT_SECURITY_SETTINGS.linkApplications.rateLimit },
  },
  likes: {
    rateLimit: { ...DEFAULT_SECURITY_SETTINGS.likes.rateLimit },
  },
};

export function cloneSecuritySettings(settings: SecuritySettings = DEFAULT_SECURITY_SETTINGS): SecuritySettings {
  return {
    login: {
      ...settings.login,
      rateLimit: { ...settings.login.rateLimit },
    },
    comments: {
      ...settings.comments,
      rateLimit: { ...settings.comments.rateLimit },
    },
    guestbook: {
      ...settings.guestbook,
      rateLimit: { ...settings.guestbook.rateLimit },
    },
    linkApplications: {
      ...settings.linkApplications,
      rateLimit: { ...settings.linkApplications.rateLimit },
    },
    likes: {
      rateLimit: { ...settings.likes.rateLimit },
    },
  };
}

export function cloneSiteSecuritySettings(settings: SiteSecuritySettings = DEFAULT_SITE_SECURITY_SETTINGS): SiteSecuritySettings {
  return {
    turnstileSiteKey: settings.turnstileSiteKey,
    ...cloneSecuritySettings(settings),
  };
}

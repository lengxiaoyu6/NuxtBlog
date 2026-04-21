import type { Prisma } from '@prisma/client';
import { usePrismaClient } from '../utils/prisma';
import { DEFAULT_PAGE_SETTINGS } from '../../app/constants/page-settings';
import type { AdminSettingsForm } from '../../app/types/admin-settings';

const siteSettingsInclude = {
  socialLinks: {
    orderBy: {
      sortOrder: 'asc',
    },
  },
  navItems: {
    orderBy: {
      sortOrder: 'asc',
    },
  },
} satisfies Prisma.SiteSettingsInclude;

export type SiteSettingsRecord = Prisma.SiteSettingsGetPayload<{
  include: typeof siteSettingsInclude;
}>;

export interface UpdateNotificationModuleSettingsRecordInput {
  notificationSettingsJson: Prisma.InputJsonValue;
  notificationSecretsCiphertext: string | null;
}

export async function readSiteSettingsRecord(): Promise<SiteSettingsRecord | null> {
  return usePrismaClient().siteSettings.findUnique({
    where: {
      siteCode: 'default',
    },
    include: siteSettingsInclude,
  });
}

function toSocialLinkCreateInput(input: AdminSettingsForm['socialLinks']) {
  return input.map((item) => ({
    id: item.id,
    label: item.label,
    url: item.url,
    icon: item.icon,
    enabled: item.enabled,
    sortOrder: item.order,
  }));
}

function toNavItemCreateInput(input: AdminSettingsForm['navItems']) {
  return input.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    openInNewTab: item.openInNewTab,
    enabled: item.enabled,
    sortOrder: item.order,
  }));
}

export function toNotificationSettingsJson(input: AdminSettingsForm['notification']) {
  return {
    enabled: input.enabled,
    subjectPrefix: input.subjectPrefix,
    adminRecipients: input.adminRecipients,
    smtp: {
      host: input.smtp.host,
      port: input.smtp.port,
      secure: input.smtp.secure,
      username: input.smtp.username,
      fromName: input.smtp.fromName,
      fromEmail: input.smtp.fromEmail,
      replyToEmail: input.smtp.replyToEmail,
    },
    events: {
      postCommentCreated: input.events.postCommentCreated,
      postCommentReply: input.events.postCommentReply,
      guestbookCreated: input.events.guestbookCreated,
    },
  } satisfies Prisma.InputJsonValue;
}

function toSecuritySettingsJson(input: AdminSettingsForm['security']) {
  return {
    login: {
      captchaEnabled: input.login.captchaEnabled,
      rateLimit: {
        windowSeconds: input.login.rateLimit.windowSeconds,
        maxPerIp: input.login.rateLimit.maxPerIp,
        maxPerSession: input.login.rateLimit.maxPerSession,
      },
      maxFailures: input.login.maxFailures,
      cooldownSeconds: input.login.cooldownSeconds,
    },
    comments: {
      captchaEnabled: input.comments.captchaEnabled,
      rateLimit: {
        windowSeconds: input.comments.rateLimit.windowSeconds,
        maxPerIp: input.comments.rateLimit.maxPerIp,
        maxPerSession: input.comments.rateLimit.maxPerSession,
      },
    },
    guestbook: {
      captchaEnabled: input.guestbook.captchaEnabled,
      rateLimit: {
        windowSeconds: input.guestbook.rateLimit.windowSeconds,
        maxPerIp: input.guestbook.rateLimit.maxPerIp,
        maxPerSession: input.guestbook.rateLimit.maxPerSession,
      },
    },
    linkApplications: {
      captchaEnabled: input.linkApplications.captchaEnabled,
      rateLimit: {
        windowSeconds: input.linkApplications.rateLimit.windowSeconds,
        maxPerIp: input.linkApplications.rateLimit.maxPerIp,
        maxPerSession: input.linkApplications.rateLimit.maxPerSession,
      },
    },
    likes: {
      rateLimit: {
        windowSeconds: input.likes.rateLimit.windowSeconds,
        maxPerIp: input.likes.rateLimit.maxPerIp,
        maxPerSession: input.likes.rateLimit.maxPerSession,
      },
    },
  } satisfies Prisma.InputJsonValue;
}

export async function upsertSiteSettingsRecord(input: AdminSettingsForm): Promise<SiteSettingsRecord> {
  const defaultFriendCard = DEFAULT_PAGE_SETTINGS.links.friendCard;

  return usePrismaClient().siteSettings.upsert({
    where: {
      siteCode: 'default',
    },
    create: {
      siteCode: 'default',
      siteName: input.site.name,
      siteUrl: input.site.url,
      siteDescription: input.site.description,
      siteLogoUrl: input.site.logoUrl || null,
      siteLogoAlt: input.site.logoAlt,
      ownerName: input.owner.name,
      ownerAvatarUrl: input.owner.avatarUrl || null,
      ownerBio: input.owner.bio,
      ownerLocation: input.owner.location || null,
      ownerTagline: input.owner.tagline || null,
      friendCardName: defaultFriendCard.name,
      friendCardDescription: defaultFriendCard.description,
      friendCardUrl: defaultFriendCard.url,
      friendCardAvatarUrl: defaultFriendCard.avatarUrl || null,
      contactEmail: input.footer.contactEmail,
      footerCopyright: input.footer.copyright,
      footerIcpText: input.footer.icpText || null,
      footerIcpLink: input.footer.icpLink || null,
      footerNote: input.footer.note || null,
      turnstileSiteKey: input.security.turnstileSiteKey || null,
      securitySettingsJson: toSecuritySettingsJson(input.security),
      notificationSettingsJson: null,
      notificationSecretsCiphertext: null,
      socialLinks: {
        create: toSocialLinkCreateInput(input.socialLinks),
      },
      navItems: {
        create: toNavItemCreateInput(input.navItems),
      },
    },
    update: {
      siteName: input.site.name,
      siteUrl: input.site.url,
      siteDescription: input.site.description,
      siteLogoUrl: input.site.logoUrl || null,
      siteLogoAlt: input.site.logoAlt,
      ownerName: input.owner.name,
      ownerAvatarUrl: input.owner.avatarUrl || null,
      ownerBio: input.owner.bio,
      ownerLocation: input.owner.location || null,
      ownerTagline: input.owner.tagline || null,
      contactEmail: input.footer.contactEmail,
      footerCopyright: input.footer.copyright,
      footerIcpText: input.footer.icpText || null,
      footerIcpLink: input.footer.icpLink || null,
      footerNote: input.footer.note || null,
      turnstileSiteKey: input.security.turnstileSiteKey || null,
      securitySettingsJson: toSecuritySettingsJson(input.security),
      socialLinks: {
        deleteMany: {},
        create: toSocialLinkCreateInput(input.socialLinks),
      },
      navItems: {
        deleteMany: {},
        create: toNavItemCreateInput(input.navItems),
      },
    },
    include: siteSettingsInclude,
  });
}

export async function updateNotificationModuleSettingsRecord(input: UpdateNotificationModuleSettingsRecordInput): Promise<SiteSettingsRecord> {
  return usePrismaClient().siteSettings.update({
    where: {
      siteCode: 'default',
    },
    data: {
      notificationSettingsJson: input.notificationSettingsJson,
      notificationSecretsCiphertext: input.notificationSecretsCiphertext,
    },
    include: siteSettingsInclude,
  });
}

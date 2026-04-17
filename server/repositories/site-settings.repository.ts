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
} as const;

export async function readSiteSettingsRecord() {
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

export async function upsertSiteSettingsRecord(input: AdminSettingsForm) {
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
      securitySettingsJson: {
        login: input.security.login,
        comments: input.security.comments,
        guestbook: input.security.guestbook,
        linkApplications: input.security.linkApplications,
        likes: input.security.likes,
      },
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
      securitySettingsJson: {
        login: input.security.login,
        comments: input.security.comments,
        guestbook: input.security.guestbook,
        linkApplications: input.security.linkApplications,
        likes: input.security.likes,
      },
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

import type { SiteSecuritySettings } from '~~/shared/types/security';

export type SiteSocialIcon = 'github' | 'twitter' | 'linkedin' | 'mail' | 'website';

export interface SiteProfileSettings {
  name: string;
  url: string;
  description: string;
  logoUrl: string;
  logoAlt: string;
}

export interface SiteOwnerSettings {
  name: string;
  avatarUrl: string;
  bio: string;
  location: string;
  tagline: string;
}

export interface SiteSocialLink {
  id: string;
  label: string;
  url: string;
  icon: SiteSocialIcon;
  enabled: boolean;
  order: number;
}

export interface SiteNavItem {
  id: string;
  label: string;
  href: string;
  openInNewTab: boolean;
  enabled: boolean;
  order: number;
}

export interface SiteFooterSettings {
  contactEmail: string;
  copyright: string;
  icpText: string;
  icpLink: string;
  note: string;
}

export interface AdminSettingsForm {
  site: SiteProfileSettings;
  owner: SiteOwnerSettings;
  socialLinks: SiteSocialLink[];
  navItems: SiteNavItem[];
  footer: SiteFooterSettings;
  security: SiteSecuritySettings;
}

export type AdminSettingsSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

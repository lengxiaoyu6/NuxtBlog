export type ManagedPageKey = 'about' | 'guestbook' | 'links' | 'projects';

export interface PageSeoSettings {
  title: string;
  description: string;
}

export interface BaseManagedPageSettings {
  enabled: boolean;
  seo: PageSeoSettings;
}

export type AboutSkillTheme = 'blue' | 'emerald' | 'violet' | 'amber';

export interface AboutSkillItem {
  id: string;
  name: string;
  level: number;
}

export interface AboutSkillCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  level: number;
  theme: AboutSkillTheme;
  items: AboutSkillItem[];
}

export interface AboutPageSettings extends BaseManagedPageSettings {
  intro: {
    heading: string;
    paragraphs: string[];
  };
  location: {
    label: string;
  };
  skillsSection: {
    enabled: boolean;
    heading: string;
  };
  skills: AboutSkillCard[];
}

export interface GuestbookPageSettings extends BaseManagedPageSettings {
  commentSection: {
    title: string;
    description: string;
  };
}

export type FriendLinkStatus = 'visible' | 'hidden' | 'pending';

export interface FriendLinkItem {
  id: string;
  name: string;
  url: string;
  description: string;
  avatarUrl: string;
  status: FriendLinkStatus;
}

export interface FriendCardSettings {
  name: string;
  description: string;
  url: string;
  avatarUrl: string;
}

export interface LinksPageSettings extends BaseManagedPageSettings {
  friendCard: FriendCardSettings;
  friendsSection: {
    title: string;
  };
  friends: FriendLinkItem[];
}

export interface ManagedProjectItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  tags: string[];
  githubUrl: string;
  demoUrl: string;
  enabled: boolean;
}

export interface ProjectsPageSettings extends BaseManagedPageSettings {
  projectsSection: {
    title: string;
  };
  projects: ManagedProjectItem[];
  emptyState: {
    title: string;
    description: string;
  };
}

export interface ManagedPageSettings {
  about: AboutPageSettings;
  guestbook: GuestbookPageSettings;
  links: LinksPageSettings;
  projects: ProjectsPageSettings;
}

export interface ManagedPageMeta {
  key: ManagedPageKey;
  label: string;
  path: string;
  adminPath: string;
}

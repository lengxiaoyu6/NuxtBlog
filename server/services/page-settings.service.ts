import { clonePageSettings, DEFAULT_PAGE_SETTINGS } from '../../app/constants/page-settings';
import type {
  AboutPageSettings,
  GuestbookPageSettings,
  LinksPageSettings,
  ManagedPageSettings,
  ProjectsPageSettings,
} from '../../app/types/page-settings';
import {
  readManagedPageRecords,
  saveAboutPageSettingsRecord,
  saveGuestbookPageSettingsRecord,
  saveLinksPageSettingsMetaRecord,
  saveLinksPageSettingsRecord,
  saveProjectsPageSettingsRecord,
} from '../repositories/page-settings.repository';
import { readSiteSettingsRecord } from '../repositories/site-settings.repository';

function isValidUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  }
  catch {
    return false;
  }
}

function normalizeAboutPageSettings(input: AboutPageSettings) {
  return clonePageSettings({
    ...clonePageSettings(DEFAULT_PAGE_SETTINGS),
    about: input,
  }).about;
}

function normalizeGuestbookPageSettings(input: GuestbookPageSettings) {
  return clonePageSettings({
    ...clonePageSettings(DEFAULT_PAGE_SETTINGS),
    guestbook: input,
  }).guestbook;
}

function normalizeLinksPageSettings(input: LinksPageSettings) {
  return clonePageSettings({
    ...clonePageSettings(DEFAULT_PAGE_SETTINGS),
    links: input,
  }).links;
}

function normalizeProjectsPageSettings(input: ProjectsPageSettings) {
  return clonePageSettings({
    ...clonePageSettings(DEFAULT_PAGE_SETTINGS),
    projects: input,
  }).projects;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item));
}

function resolveLinksFriendCard(
  record: NonNullable<Awaited<ReturnType<typeof readManagedPageRecords>>[number]['linksPageSettings']>,
  fallbackRecord: Awaited<ReturnType<typeof readSiteSettingsRecord>>
) {
  const defaultFriendCard = clonePageSettings(DEFAULT_PAGE_SETTINGS).links.friendCard;

  return {
    name: record.friendCardName ?? fallbackRecord?.friendCardName ?? defaultFriendCard.name,
    description: record.friendCardDescription ?? fallbackRecord?.friendCardDescription ?? defaultFriendCard.description,
    url: record.friendCardUrl ?? fallbackRecord?.friendCardUrl ?? defaultFriendCard.url,
    avatarUrl: record.friendCardAvatarUrl ?? fallbackRecord?.friendCardAvatarUrl ?? defaultFriendCard.avatarUrl,
  };
}

function mapRecordsToPageSettings(
  records: Awaited<ReturnType<typeof readManagedPageRecords>>,
  fallbackSiteSettingsRecord: Awaited<ReturnType<typeof readSiteSettingsRecord>>
) {
  const settings = clonePageSettings(DEFAULT_PAGE_SETTINGS);

  for (const record of records) {
    if (record.pageKey === 'about' && record.aboutPageSettings) {
      settings.about = {
        enabled: record.enabled,
        seo: {
          title: record.seoTitle,
          description: record.seoDescription,
        },
        intro: {
          heading: record.aboutPageSettings.introHeading,
          paragraphs: toStringArray(record.aboutPageSettings.introParagraphsJson),
        },
        location: {
          label: record.aboutPageSettings.locationLabel ?? '',
        },
        skillsSection: {
          enabled: record.aboutPageSettings.skillsEnabled,
          heading: record.aboutPageSettings.skillsHeading,
        },
        skills: record.aboutPageSettings.skillCards.map((card) => ({
          id: card.id,
          title: card.title,
          subtitle: card.subtitle,
          description: card.description,
          level: card.level,
          theme: card.theme,
          items: card.items.map((item) => ({
            id: item.id,
            name: item.name,
            level: item.level,
          })),
        })),
      };
    }

    if (record.pageKey === 'guestbook' && record.guestbookPageSettings) {
      settings.guestbook = {
        enabled: record.enabled,
        seo: {
          title: record.seoTitle,
          description: record.seoDescription,
        },
        commentSection: {
          title: record.guestbookPageSettings.commentSectionTitle,
          description: record.guestbookPageSettings.commentSectionDescription ?? '',
        },
      };
    }

    if (record.pageKey === 'links' && record.linksPageSettings) {
      settings.links = {
        enabled: record.enabled,
        seo: {
          title: record.seoTitle,
          description: record.seoDescription,
        },
        friendCard: resolveLinksFriendCard(record.linksPageSettings, fallbackSiteSettingsRecord),
        friendsSection: {
          title: record.linksPageSettings.friendsSectionTitle,
        },
        friends: record.linksPageSettings.friendLinks.map((item) => ({
          id: item.id,
          name: item.name,
          url: item.url,
          description: item.description,
          avatarUrl: item.avatarUrl,
          status: item.status,
        })),
      };
    }

    if (record.pageKey === 'projects' && record.projectsPageSettings) {
      settings.projects = {
        enabled: record.enabled,
        seo: {
          title: record.seoTitle,
          description: record.seoDescription,
        },
        projectsSection: {
          title: record.projectsPageSettings.projectsSectionTitle,
        },
        projects: record.projectsPageSettings.projects.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          image: item.image ?? '',
          category: item.category ?? '',
          tags: toStringArray(item.tagsJson),
          githubUrl: item.githubUrl ?? '',
          demoUrl: item.demoUrl ?? '',
          enabled: item.enabled,
        })),
        emptyState: {
          title: record.projectsPageSettings.emptyStateTitle,
          description: record.projectsPageSettings.emptyStateDescription,
        },
      };
    }
  }

  return settings;
}

function validateAboutPageSettings(input: AboutPageSettings) {
  if (input.enabled && (!input.seo.title.trim() || !input.seo.description.trim())) {
    throw createError({ statusCode: 400, statusMessage: '启用页面时需填写 SEO 标题和 SEO 描述。' });
  }

  if (!input.intro.heading.trim()) {
    throw createError({ statusCode: 400, statusMessage: '请输入故事区块标题。' });
  }

  if (!input.skillsSection.heading.trim()) {
    throw createError({ statusCode: 400, statusMessage: '请输入技能区块标题。' });
  }

  for (const card of input.skills) {
    if (!card.title.trim() || !card.description.trim()) {
      throw createError({ statusCode: 400, statusMessage: '技能卡片需填写标题和描述。' });
    }

    if (card.level < 0 || card.level > 100) {
      throw createError({ statusCode: 400, statusMessage: '技能卡片掌握度需在 0 到 100 之间。' });
    }

    if (card.items.length === 0) {
      throw createError({ statusCode: 400, statusMessage: '每张技能卡片至少保留一个能力项。' });
    }

    for (const item of card.items) {
      if (!item.name.trim()) {
        throw createError({ statusCode: 400, statusMessage: '能力项名称不能为空。' });
      }

      if (item.level < 0 || item.level > 100) {
        throw createError({ statusCode: 400, statusMessage: '能力项掌握度需在 0 到 100 之间。' });
      }
    }
  }
}

function validateGuestbookPageSettings(input: GuestbookPageSettings) {
  if (input.enabled && (!input.seo.title.trim() || !input.seo.description.trim())) {
    throw createError({ statusCode: 400, statusMessage: '启用页面时需填写 SEO 标题和 SEO 描述。' });
  }

  if (!input.commentSection.title.trim()) {
    throw createError({ statusCode: 400, statusMessage: '请输入留言区标题。' });
  }
}

function validateLinksPageSettings(input: LinksPageSettings) {
  if (input.enabled && (!input.seo.title.trim() || !input.seo.description.trim())) {
    throw createError({ statusCode: 400, statusMessage: '启用页面时需填写 SEO 标题和 SEO 描述。' });
  }

  if (!input.friendCard.name.trim()) {
    throw createError({ statusCode: 400, statusMessage: '请输入展示名称' });
  }

  if (!input.friendCard.description.trim()) {
    throw createError({ statusCode: 400, statusMessage: '请输入展示简介' });
  }

  if (!input.friendCard.url.trim() || !isValidUrl(input.friendCard.url.trim())) {
    throw createError({ statusCode: 400, statusMessage: '请输入有效的展示链接' });
  }

  if (!input.friendCard.avatarUrl.trim() || !isValidUrl(input.friendCard.avatarUrl.trim())) {
    throw createError({ statusCode: 400, statusMessage: '请输入有效的头像链接' });
  }
}

function validateProjectsPageSettings(input: ProjectsPageSettings) {
  if (input.enabled && (!input.seo.title.trim() || !input.seo.description.trim())) {
    throw createError({ statusCode: 400, statusMessage: '启用页面时需填写 SEO 标题和 SEO 描述。' });
  }

  if (!input.projectsSection.title.trim()) {
    throw createError({ statusCode: 400, statusMessage: '请输入项目区块标题。' });
  }

  if (!input.emptyState.title.trim() || !input.emptyState.description.trim()) {
    throw createError({ statusCode: 400, statusMessage: '请输入空状态标题和说明。' });
  }

  for (const item of input.projects) {
    if (!item.title.trim() || !item.description.trim() || !item.image.trim()) {
      throw createError({ statusCode: 400, statusMessage: '项目条目需填写标题、描述和图片链接。' });
    }

    if (!isValidUrl(item.image) || !isValidUrl(item.githubUrl) || !isValidUrl(item.demoUrl)) {
      throw createError({ statusCode: 400, statusMessage: '项目条目的图片、源码或演示链接格式无效。' });
    }
  }
}

export async function ensureSeedPageSettings() {
  const records = await readManagedPageRecords();
  const existingKeys = new Set(records.map((item) => item.pageKey));

  if (!existingKeys.has('about')) {
    await saveAboutPageSettingsRecord(clonePageSettings(DEFAULT_PAGE_SETTINGS).about);
  }

  if (!existingKeys.has('guestbook')) {
    await saveGuestbookPageSettingsRecord(clonePageSettings(DEFAULT_PAGE_SETTINGS).guestbook);
  }

  if (!existingKeys.has('links')) {
    await saveLinksPageSettingsRecord(clonePageSettings(DEFAULT_PAGE_SETTINGS).links);
  }

  if (!existingKeys.has('projects')) {
    await saveProjectsPageSettingsRecord(clonePageSettings(DEFAULT_PAGE_SETTINGS).projects);
  }
}

export async function readPageSettings() {
  await ensureSeedPageSettings();
  const [records, siteSettingsRecord] = await Promise.all([
    readManagedPageRecords(),
    readSiteSettingsRecord(),
  ]);
  return mapRecordsToPageSettings(records, siteSettingsRecord);
}

export async function readPublicPageSettings() {
  const settings = await readPageSettings();

  return {
    ...settings,
    links: {
      ...settings.links,
      friends: settings.links.friends.filter((item) => item.status === 'visible' && item.url.trim()),
    },
    projects: {
      ...settings.projects,
      projects: settings.projects.projects.filter((item) => item.enabled),
    },
  } satisfies ManagedPageSettings;
}

export async function readAboutPageSettings() {
  return (await readPageSettings()).about;
}

export async function readGuestbookPageSettings() {
  return (await readPageSettings()).guestbook;
}

export async function readLinksPageSettings() {
  return (await readPageSettings()).links;
}

export async function readProjectsPageSettings() {
  return (await readPageSettings()).projects;
}

export async function saveAboutPageSettings(input: AboutPageSettings) {
  const normalizedInput = normalizeAboutPageSettings(input);
  validateAboutPageSettings(normalizedInput);
  const savedRecord = await saveAboutPageSettingsRecord(normalizedInput);
  return mapRecordsToPageSettings([savedRecord], null).about;
}

export async function saveGuestbookPageSettings(input: GuestbookPageSettings) {
  const normalizedInput = normalizeGuestbookPageSettings(input);
  validateGuestbookPageSettings(normalizedInput);
  const savedRecord = await saveGuestbookPageSettingsRecord(normalizedInput);
  return mapRecordsToPageSettings([savedRecord], null).guestbook;
}

export async function saveLinksPageSettings(input: LinksPageSettings) {
  const normalizedInput = normalizeLinksPageSettings(input);
  validateLinksPageSettings(normalizedInput);
  const savedRecord = await saveLinksPageSettingsMetaRecord(normalizedInput);
  return mapRecordsToPageSettings([savedRecord], null).links;
}

export async function saveProjectsPageSettings(input: ProjectsPageSettings) {
  const normalizedInput = normalizeProjectsPageSettings(input);
  validateProjectsPageSettings(normalizedInput);
  const savedRecord = await saveProjectsPageSettingsRecord(normalizedInput);
  return mapRecordsToPageSettings([savedRecord], null).projects;
}

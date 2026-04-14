import { usePrismaClient } from '../utils/prisma';
import type {
  AboutPageSettings,
  GuestbookPageSettings,
  LinksPageSettings,
  ProjectsPageSettings,
} from '../../app/types/page-settings';

const managedPageInclude = {
  aboutPageSettings: {
    include: {
      skillCards: {
        orderBy: {
          sortOrder: 'asc',
        },
        include: {
          items: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      },
    },
  },
  guestbookPageSettings: true,
  linksPageSettings: {
    include: {
      friendLinks: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  },
  projectsPageSettings: {
    include: {
      projects: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  },
} as const;

function toLinksFriendCardRecordInput(input: LinksPageSettings['friendCard']) {
  return {
    friendCardName: input.name || null,
    friendCardDescription: input.description || null,
    friendCardUrl: input.url || null,
    friendCardAvatarUrl: input.avatarUrl || null,
  };
}

function toFriendLinksCreateInput(input: LinksPageSettings['friends']) {
  return input.map((item, index) => ({
    id: item.id,
    name: item.name,
    url: item.url,
    description: item.description,
    avatarUrl: item.avatarUrl,
    contact: null,
    status: item.status,
    sortOrder: index + 1,
  }));
}

export async function readManagedPageRecords() {
  return usePrismaClient().managedPage.findMany({
    orderBy: [
      {
        id: 'asc',
      },
    ],
    include: managedPageInclude,
  });
}

export async function saveAboutPageSettingsRecord(input: AboutPageSettings) {
  return usePrismaClient().managedPage.upsert({
    where: {
      pageKey: 'about',
    },
    create: {
      pageKey: 'about',
      enabled: input.enabled,
      seoTitle: input.seo.title,
      seoDescription: input.seo.description,
      aboutPageSettings: {
        create: {
          introHeading: input.intro.heading,
          introParagraphsJson: input.intro.paragraphs,
          locationLabel: input.location.label || null,
          skillsEnabled: input.skillsSection.enabled,
          skillsHeading: input.skillsSection.heading,
          skillCards: {
            create: input.skills.map((card, cardIndex) => ({
              id: card.id,
              title: card.title,
              subtitle: card.subtitle,
              description: card.description,
              level: card.level,
              theme: card.theme,
              sortOrder: cardIndex + 1,
              items: {
                create: card.items.map((item, itemIndex) => ({
                  id: item.id,
                  name: item.name,
                  level: item.level,
                  sortOrder: itemIndex + 1,
                })),
              },
            })),
          },
        },
      },
    },
    update: {
      enabled: input.enabled,
      seoTitle: input.seo.title,
      seoDescription: input.seo.description,
      aboutPageSettings: {
        upsert: {
          create: {
            introHeading: input.intro.heading,
            introParagraphsJson: input.intro.paragraphs,
            locationLabel: input.location.label || null,
            skillsEnabled: input.skillsSection.enabled,
            skillsHeading: input.skillsSection.heading,
            skillCards: {
              create: input.skills.map((card, cardIndex) => ({
                id: card.id,
                title: card.title,
                subtitle: card.subtitle,
                description: card.description,
                level: card.level,
                theme: card.theme,
                sortOrder: cardIndex + 1,
                items: {
                  create: card.items.map((item, itemIndex) => ({
                    id: item.id,
                    name: item.name,
                    level: item.level,
                    sortOrder: itemIndex + 1,
                  })),
                },
              })),
            },
          },
          update: {
            introHeading: input.intro.heading,
            introParagraphsJson: input.intro.paragraphs,
            locationLabel: input.location.label || null,
            skillsEnabled: input.skillsSection.enabled,
            skillsHeading: input.skillsSection.heading,
            skillCards: {
              deleteMany: {},
              create: input.skills.map((card, cardIndex) => ({
                id: card.id,
                title: card.title,
                subtitle: card.subtitle,
                description: card.description,
                level: card.level,
                theme: card.theme,
                sortOrder: cardIndex + 1,
                items: {
                  create: card.items.map((item, itemIndex) => ({
                    id: item.id,
                    name: item.name,
                    level: item.level,
                    sortOrder: itemIndex + 1,
                  })),
                },
              })),
            },
          },
        },
      },
    },
    include: managedPageInclude,
  });
}

export async function saveGuestbookPageSettingsRecord(input: GuestbookPageSettings) {
  return usePrismaClient().managedPage.upsert({
    where: {
      pageKey: 'guestbook',
    },
    create: {
      pageKey: 'guestbook',
      enabled: input.enabled,
      seoTitle: input.seo.title,
      seoDescription: input.seo.description,
      guestbookPageSettings: {
        create: {
          commentSectionTitle: input.commentSection.title,
          commentSectionDescription: input.commentSection.description || null,
        },
      },
    },
    update: {
      enabled: input.enabled,
      seoTitle: input.seo.title,
      seoDescription: input.seo.description,
      guestbookPageSettings: {
        upsert: {
          create: {
            commentSectionTitle: input.commentSection.title,
            commentSectionDescription: input.commentSection.description || null,
          },
          update: {
            commentSectionTitle: input.commentSection.title,
            commentSectionDescription: input.commentSection.description || null,
          },
        },
      },
    },
    include: managedPageInclude,
  });
}

export async function saveLinksPageSettingsRecord(input: LinksPageSettings) {
  return usePrismaClient().managedPage.upsert({
    where: {
      pageKey: 'links',
    },
    create: {
      pageKey: 'links',
      enabled: input.enabled,
      seoTitle: input.seo.title,
      seoDescription: input.seo.description,
      linksPageSettings: {
        create: {
          ...toLinksFriendCardRecordInput(input.friendCard),
          friendsSectionTitle: input.friendsSection.title,
          friendLinks: {
            create: toFriendLinksCreateInput(input.friends),
          },
        },
      },
    },
    update: {
      enabled: input.enabled,
      seoTitle: input.seo.title,
      seoDescription: input.seo.description,
      linksPageSettings: {
        upsert: {
          create: {
            ...toLinksFriendCardRecordInput(input.friendCard),
            friendsSectionTitle: input.friendsSection.title,
            friendLinks: {
              create: toFriendLinksCreateInput(input.friends),
            },
          },
          update: {
            ...toLinksFriendCardRecordInput(input.friendCard),
            friendsSectionTitle: input.friendsSection.title,
            friendLinks: {
              deleteMany: {},
              create: toFriendLinksCreateInput(input.friends),
            },
          },
        },
      },
    },
    include: managedPageInclude,
  });
}

export async function saveLinksPageSettingsMetaRecord(input: LinksPageSettings) {
  return usePrismaClient().managedPage.upsert({
    where: {
      pageKey: 'links',
    },
    create: {
      pageKey: 'links',
      enabled: input.enabled,
      seoTitle: input.seo.title,
      seoDescription: input.seo.description,
      linksPageSettings: {
        create: {
          ...toLinksFriendCardRecordInput(input.friendCard),
          friendsSectionTitle: input.friendsSection.title,
        },
      },
    },
    update: {
      enabled: input.enabled,
      seoTitle: input.seo.title,
      seoDescription: input.seo.description,
      linksPageSettings: {
        upsert: {
          create: {
            ...toLinksFriendCardRecordInput(input.friendCard),
            friendsSectionTitle: input.friendsSection.title,
          },
          update: {
            ...toLinksFriendCardRecordInput(input.friendCard),
            friendsSectionTitle: input.friendsSection.title,
          },
        },
      },
    },
    include: managedPageInclude,
  });
}

export async function saveProjectsPageSettingsRecord(input: ProjectsPageSettings) {
  return usePrismaClient().managedPage.upsert({
    where: {
      pageKey: 'projects',
    },
    create: {
      pageKey: 'projects',
      enabled: input.enabled,
      seoTitle: input.seo.title,
      seoDescription: input.seo.description,
      projectsPageSettings: {
        create: {
          projectsSectionTitle: input.projectsSection.title,
          emptyStateTitle: input.emptyState.title,
          emptyStateDescription: input.emptyState.description,
          projects: {
            create: input.projects.map((item, index) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              image: item.image || null,
              category: item.category || null,
              tagsJson: item.tags,
              githubUrl: item.githubUrl || null,
              demoUrl: item.demoUrl || null,
              enabled: item.enabled,
              sortOrder: index + 1,
            })),
          },
        },
      },
    },
    update: {
      enabled: input.enabled,
      seoTitle: input.seo.title,
      seoDescription: input.seo.description,
      projectsPageSettings: {
        upsert: {
          create: {
            projectsSectionTitle: input.projectsSection.title,
            emptyStateTitle: input.emptyState.title,
            emptyStateDescription: input.emptyState.description,
            projects: {
              create: input.projects.map((item, index) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                image: item.image || null,
                category: item.category || null,
                tagsJson: item.tags,
                githubUrl: item.githubUrl || null,
                demoUrl: item.demoUrl || null,
                enabled: item.enabled,
                sortOrder: index + 1,
              })),
            },
          },
          update: {
            projectsSectionTitle: input.projectsSection.title,
            emptyStateTitle: input.emptyState.title,
            emptyStateDescription: input.emptyState.description,
            projects: {
              deleteMany: {},
              create: input.projects.map((item, index) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                image: item.image || null,
                category: item.category || null,
                tagsJson: item.tags,
                githubUrl: item.githubUrl || null,
                demoUrl: item.demoUrl || null,
                enabled: item.enabled,
                sortOrder: index + 1,
              })),
            },
          },
        },
      },
    },
    include: managedPageInclude,
  });
}

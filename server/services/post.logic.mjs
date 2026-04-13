const shanghaiDateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const shanghaiDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function isRecord(value) {
  return typeof value === 'object' && value !== null;
}

function readFormatterPartMap(formatter, value) {
  const parts = {};

  for (const part of formatter.formatToParts(value)) {
    if (part.type !== 'literal') {
      parts[part.type] = part.value;
    }
  }

  return parts;
}

export function formatDateTimeInShanghai(value) {
  const parts = readFormatterPartMap(shanghaiDateTimeFormatter, value);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatDateInShanghai(value) {
  const parts = readFormatterPartMap(shanghaiDateFormatter, value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readRecordSlug(record) {
  return normalizeText(record?.slug);
}

function normalizeTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((item) => normalizeText(item)).filter(Boolean))).slice(0, 5);
}

function normalizePlainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_\-\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function estimateReadTimeText(markdown) {
  const plainText = normalizePlainText(markdown);
  const hanCharacterCount = (plainText.match(/\p{Script=Han}/gu) ?? []).length;
  const nonHanText = plainText.replace(/\p{Script=Han}/gu, ' ');
  const nonHanWordCount = (nonHanText.match(/[A-Za-z0-9]+(?:[._/-][A-Za-z0-9]+)*/g) ?? []).length;
  const readingUnitCount = hanCharacterCount + nonHanWordCount * 2;

  return `${Math.max(1, Math.ceil(readingUnitCount / 260))} min`;
}

export function parseTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === 'string');
}

export function normalizePostInput(input) {
  return {
    title: normalizeText(input?.title),
    slug: normalizeText(input?.slug),
    excerpt: normalizeText(input?.excerpt),
    contentMarkdown: normalizeText(input?.contentMarkdown),
    category: normalizeText(input?.category),
    tags: normalizeTags(input?.tags),
    coverImageUrl: normalizeText(input?.coverImageUrl),
    status: typeof input?.status === 'string' ? input.status.trim() : '',
    isPinned: Boolean(input?.isPinned),
  };
}

export function resolvePostPublicIdentifier(record) {
  const slug = readRecordSlug(record);
  return slug || String(record.id);
}

function readCategoryCount(record) {
  if (!isRecord(record)) {
    return 0;
  }

  const count = record.count;
  if (typeof count === 'number') {
    return count;
  }

  const aggregateCount = isRecord(record._count) ? record._count._all : null;
  if (typeof aggregateCount === 'number') {
    return aggregateCount;
  }

  return 1;
}

export function createCategoryItems(records) {
  const countMap = new Map();

  for (const record of records) {
    if (!isRecord(record) || typeof record.category !== 'string' || !record.category) {
      continue;
    }

    countMap.set(record.category, (countMap.get(record.category) ?? 0) + readCategoryCount(record));
  }

  return [...countMap.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0], 'zh-Hans-CN');
    })
    .map(([name, count]) => ({ name, count }));
}

export function toPublicPostListItem(record) {
  const publishedAt = record.publishedAt ?? record.createdAt;

  return {
    id: record.id,
    identifier: resolvePostPublicIdentifier(record),
    title: record.title,
    excerpt: record.excerpt,
    category: record.category,
    tags: parseTags(record.tagsJson),
    coverImageUrl: record.coverImageUrl,
    publishedAt: formatDateInShanghai(publishedAt),
    readTimeText: record.readTimeText,
    isPinned: record.isPinned,
    likesCount: record.likesCount,
  };
}

export function isUniqueConstraintErrorForField(error, fieldName) {
  if (!isRecord(error)) {
    return false;
  }

  const isUniqueConstraintError = error.code === 'P2002';
  if (!isUniqueConstraintError) {
    return false;
  }

  const meta = isRecord(error.meta) ? error.meta : null;
  const target = meta?.target;

  if (Array.isArray(target)) {
    return target.some((item) => typeof item === 'string' && item === fieldName);
  }

  if (typeof target === 'string') {
    return target.includes(fieldName);
  }

  return true;
}

export const postLikedIdsCookieKey = 'blog-post-liked-ids';
export const postLikedIdsStorageKey = 'blog-post-liked-ids';
export const postViewedAtStorageKey = 'blog-post-viewed-at';
export const postViewWindowMs = 30 * 60 * 1000;

function normalizePostId(value) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? String(numericValue) : '';
}

function parseJson(rawValue, fallbackValue) {
  if (typeof rawValue !== 'string' || !rawValue.trim()) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

export function readLikedPostIdSet(rawValue) {
  const parsedValue = parseJson(rawValue, []);

  if (!Array.isArray(parsedValue)) {
    return new Set();
  }

  return new Set(parsedValue.map((item) => normalizePostId(item)).filter(Boolean));
}

function serializeLikedPostIdSet(likedPostIds) {
  return JSON.stringify([...likedPostIds]);
}

export function hasLikedPost(rawValue, postId) {
  const normalizedPostId = normalizePostId(postId);
  if (!normalizedPostId) {
    return false;
  }

  return readLikedPostIdSet(rawValue).has(normalizedPostId);
}

export function rememberLikedPost(rawValue, postId) {
  const normalizedPostId = normalizePostId(postId);
  const likedPostIds = readLikedPostIdSet(rawValue);

  if (normalizedPostId) {
    likedPostIds.add(normalizedPostId);
  }

  return serializeLikedPostIdSet(likedPostIds);
}

export function mergeLikedPostIds(...rawValues) {
  const likedPostIds = new Set();

  for (const rawValue of rawValues) {
    for (const likedPostId of readLikedPostIdSet(rawValue)) {
      likedPostIds.add(likedPostId);
    }
  }

  return serializeLikedPostIdSet(likedPostIds);
}

export function readPostViewedAtMap(rawValue, now = Date.now()) {
  const parsedValue = parseJson(rawValue, {});

  if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
    return {};
  }

  const viewedAtMap = {};

  for (const [postId, viewedAt] of Object.entries(parsedValue)) {
    const normalizedPostId = normalizePostId(postId);
    const numericViewedAt = Number(viewedAt);

    if (!normalizedPostId || !Number.isFinite(numericViewedAt) || numericViewedAt <= 0) {
      continue;
    }

    if (now - numericViewedAt < postViewWindowMs) {
      viewedAtMap[normalizedPostId] = numericViewedAt;
    }
  }

  return viewedAtMap;
}

export function shouldCountPostView(rawValue, postId, now = Date.now()) {
  const normalizedPostId = normalizePostId(postId);

  if (!normalizedPostId) {
    return false;
  }

  const viewedAtMap = readPostViewedAtMap(rawValue, now);
  return !viewedAtMap[normalizedPostId];
}

export function rememberPostView(rawValue, postId, now = Date.now()) {
  const normalizedPostId = normalizePostId(postId);
  const viewedAtMap = readPostViewedAtMap(rawValue, now);

  if (normalizedPostId) {
    viewedAtMap[normalizedPostId] = now;
  }

  return JSON.stringify(viewedAtMap);
}

const trailingBreakPattern = /<br class="ProseMirror-trailingBreak">/g;
const draftImagePattern = /!\[(.*?)\]\((#image-pending-[^)]+)\)\n(<!--\s*image-placeholder\b[\s\S]*?-->)/g;
const markdownImagePattern = /!\[(.*?)\]\(([^)\n]+)\)(?!\n<!--\s*image-placeholder\b)/g;
const htmlImagePattern = /<img\b[^>]*>/gi;

function extractImageAttribute(source, attribute) {
  const pattern = new RegExp(`\\s${attribute}=(["'])(.*?)\\1`, 'i');
  const match = source.match(pattern);
  return match?.[2] ?? '';
}

function extractImageDimension(source, attribute) {
  const value = Number.parseInt(extractImageAttribute(source, attribute), 10);
  return Number.isFinite(value) ? value : 0;
}

function upsertImageAttribute(source, attribute, value) {
  const pattern = new RegExp(`\\s${attribute}=(["']).*?\\1`, 'i');

  if (pattern.test(source)) {
    return source.replace(pattern, ` ${attribute}="${value}"`);
  }

  return source.replace(/\s*\/?>$/, (suffix) => ` ${attribute}="${value}"${suffix}`);
}

function removeImageAttribute(source, attribute) {
  const pattern = new RegExp(`\\s${attribute}=(["']).*?\\1`, 'i');
  return source.replace(pattern, '');
}

function normalizeImageStyleAttribute(source) {
  const style = extractImageAttribute(source, 'style');
  if (!style) {
    return source;
  }

  const retainedEntries = style
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => !/^(width|height|transform)\s*:/i.test(entry));

  if (!retainedEntries.length) {
    return removeImageAttribute(source, 'style');
  }

  return upsertImageAttribute(source, 'style', retainedEntries.join('; '));
}

function collectSyncImageDescriptors(content) {
  const descriptors = [];

  for (const match of content.matchAll(draftImagePattern)) {
    descriptors.push({
      src: match[2] ?? '',
      alt: match[1] ?? '',
      width: 0,
      height: 0
    });
  }

  for (const match of content.matchAll(markdownImagePattern)) {
    descriptors.push({
      src: match[2] ?? '',
      alt: match[1] ?? '',
      width: 0,
      height: 0
    });
  }

  for (const match of content.matchAll(htmlImagePattern)) {
    const source = match[0];
    const src = extractImageAttribute(source, 'src');
    if (!src) {
      continue;
    }

    descriptors.push({
      src,
      alt: extractImageAttribute(source, 'alt'),
      width: extractImageDimension(source, 'width'),
      height: extractImageDimension(source, 'height')
    });
  }

  return descriptors;
}

function normalizeImageMarkup(source, descriptor) {
  let markup = normalizeImageStyleAttribute(source);

  if (!descriptor) {
    return markup;
  }

  markup = upsertImageAttribute(markup, 'src', descriptor.src);
  markup = upsertImageAttribute(markup, 'alt', descriptor.alt);

  if (descriptor.width > 0 && descriptor.height > 0) {
    markup = upsertImageAttribute(markup, 'width', String(descriptor.width));
    markup = upsertImageAttribute(markup, 'height', String(descriptor.height));
    return markup;
  }

  markup = removeImageAttribute(markup, 'width');
  markup = removeImageAttribute(markup, 'height');
  return markup;
}

export function normalizeVisualEditorSyncMarkup(content, sourceContent = '') {
  const descriptors = collectSyncImageDescriptors(sourceContent);
  let descriptorIndex = 0;

  return content
    .replace(trailingBreakPattern, '')
    .replace(htmlImagePattern, (imageMarkup) => {
      const descriptor = descriptors[descriptorIndex] ?? null;
      descriptorIndex += 1;
      return normalizeImageMarkup(imageMarkup, descriptor);
    });
}

import MarkdownIt from 'markdown-it';

/**
 * @typedef {'success' | 'error' | 'info' | 'warning'} AppToastTone
 */

/**
 * @typedef {object} ExcerptExtractionResult
 * @property {string} excerpt
 * @property {string} message
 * @property {AppToastTone} tone
 */

const excerptMarkdown = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: false
});

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extractHtmlText(value) {
  return normalizeWhitespace(
    decodeHtmlEntities(
      value
        .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
    )
  );
}

function collectInlineText(tokens = []) {
  const parts = [];

  for (const token of tokens) {
    if (token.type === 'text') {
      parts.push(token.content);
      continue;
    }

    if (token.type === 'html_inline') {
      parts.push(extractHtmlText(token.content));
      continue;
    }

    if (token.type === 'softbreak' || token.type === 'hardbreak') {
      parts.push(' ');
    }
  }

  return parts.join('');
}

export function extractExcerptText(content, maxLength = 150) {
  if (!content) {
    return '';
  }

  const parts = [];

  for (const token of excerptMarkdown.parse(content, {})) {
    if (token.type === 'html_block') {
      const htmlText = extractHtmlText(token.content);
      if (htmlText) {
        parts.push(htmlText);
      }
      continue;
    }

    if (token.type !== 'inline') {
      continue;
    }

    const inlineText = normalizeWhitespace(collectInlineText(token.children ?? []));
    if (inlineText) {
      parts.push(inlineText);
    }
  }

  return normalizeWhitespace(parts.join(' ')).slice(0, maxLength);
}

/**
 * @param {string} content
 * @param {number} [maxLength=150]
 * @returns {ExcerptExtractionResult}
 */
export function getExcerptExtraction(content, maxLength = 150) {
  const normalizedContent = typeof content === 'string' ? content : '';

  if (!normalizedContent.trim()) {
    return {
      excerpt: '',
      message: '正文为空，已清空摘要',
      tone: 'warning'
    };
  }

  const excerpt = extractExcerptText(normalizedContent, maxLength);
  if (!excerpt) {
    return {
      excerpt: '',
      message: '正文当前没有可提取的摘要文本',
      tone: 'warning'
    };
  }

  return {
    excerpt,
    message: '摘要已根据正文更新',
    tone: 'success'
  };
}

import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { zipSync } from 'fflate';
import {
  buildMediaResponseHeaders,
  normalizeUploadedMediaFile,
  validateStoredMediaContent,
} from '../../server/services/media-security.service';

const onePixelGif = Buffer.from(
  'R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=',
  'base64'
);

function createDocxBuffer() {
  return Buffer.from(zipSync({
    '[Content_Types].xml': Buffer.from(
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
      'utf8'
    ),
    '_rels/.rels': Buffer.from(
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>',
      'utf8'
    ),
    'word/document.xml': Buffer.from(
      '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:document>',
      'utf8'
    ),
  }));
}

describe('normalizeUploadedMediaFile', () => {
  it('rejects html disguised as png', async () => {
    await expect(normalizeUploadedMediaFile({
      filename: 'evil.png',
      mimeType: 'image/png',
      data: Buffer.from('<html><body>owned</body></html>', 'utf8'),
    })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('normalizes a real jpeg into trusted png output', async () => {
    const jpeg = await sharp({
      create: {
        width: 12,
        height: 8,
        channels: 3,
        background: { r: 30, g: 144, b: 255 },
      },
    }).jpeg().toBuffer();

    const normalized = await normalizeUploadedMediaFile({
      filename: 'cover.jpg',
      mimeType: 'application/octet-stream',
      data: jpeg,
    });

    expect(normalized.kind).toBe('image');
    expect(normalized.extension).toBe('png');
    expect(normalized.mimeType).toBe('image/png');
    expect(normalized.width).toBe(12);
    expect(normalized.height).toBe(8);
    expect(normalized.data.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  });

  it('preserves gif uploads as gif', async () => {
    const normalized = await normalizeUploadedMediaFile({
      filename: 'pixel.gif',
      mimeType: 'image/gif',
      data: onePixelGif,
    });

    expect(normalized.kind).toBe('image');
    expect(normalized.extension).toBe('gif');
    expect(normalized.mimeType).toBe('image/gif');
    expect(normalized.data.equals(onePixelGif)).toBe(true);
    expect(normalized.width).toBe(1);
    expect(normalized.height).toBe(1);
  });

  it('rejects svg in image upload channel', async () => {
    await expect(normalizeUploadedMediaFile({
      filename: 'vector.svg',
      mimeType: 'image/svg+xml',
      data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8'),
    })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('accepts valid docx structure', async () => {
    const normalized = await normalizeUploadedMediaFile({
      filename: 'review-checklist.docx',
      mimeType: 'application/octet-stream',
      data: createDocxBuffer(),
    });

    expect(normalized.kind).toBe('document');
    expect(normalized.extension).toBe('docx');
    expect(normalized.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });

  it('rejects zip files that pretend to be docx', async () => {
    const fakeDocx = Buffer.from(zipSync({
      'notes.txt': Buffer.from('placeholder', 'utf8'),
    }));

    await expect(normalizeUploadedMediaFile({
      filename: 'fake.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      data: fakeDocx,
    })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('accepts pdf documents and rewrites their mime type to a trusted value', async () => {
    const normalized = await normalizeUploadedMediaFile({
      filename: 'handbook.pdf',
      mimeType: 'text/plain',
      data: Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n', 'utf8'),
    });

    expect(normalized.kind).toBe('document');
    expect(normalized.extension).toBe('pdf');
    expect(normalized.mimeType).toBe('application/pdf');
  });
});

describe('validateStoredMediaContent', () => {
  it('blocks historical svg image records from public output', async () => {
    await expect(validateStoredMediaContent({
      fileName: 'legacy.svg',
      kind: 'image',
      data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8'),
    })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('blocks altered document binaries', async () => {
    await expect(validateStoredMediaContent({
      fileName: 'safe.pdf',
      kind: 'document',
      data: Buffer.from('<html>tampered</html>', 'utf8'),
    })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe('buildMediaResponseHeaders', () => {
  it('adds nosniff for public files and uses trusted mime types', () => {
    expect(buildMediaResponseHeaders({
      fileName: 'cover.png',
      kind: 'image',
      mimeType: 'image/png',
      isPublic: true,
    })).toEqual({
      'Content-Type': 'image/png',
      'Content-Disposition': "inline; filename*=UTF-8''cover.png",
      'X-Content-Type-Options': 'nosniff',
    });
  });

  it('uses attachment disposition for documents', () => {
    expect(buildMediaResponseHeaders({
      fileName: 'handbook.pdf',
      kind: 'document',
      mimeType: 'application/pdf',
      isPublic: false,
    })).toEqual({
      'Content-Type': 'application/pdf',
      'Content-Disposition': "attachment; filename*=UTF-8''handbook.pdf",
    });
  });
});

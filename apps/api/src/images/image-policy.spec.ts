import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  detectImageMimeType,
  validateLotImageUploads,
} from './image-policy';

const pngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47,
  0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x00,
]);

describe('image policy', () => {
  it('detects supported image signatures', () => {
    expect(detectImageMimeType(pngBuffer)).toBe('image/png');
  });

  it('normalizes validated uploads to detected mime types', () => {
    expect(
      validateLotImageUploads([
        {
          buffer: pngBuffer,
          mimetype: 'image/png',
        },
      ]),
    ).toEqual([
      {
        buffer: pngBuffer,
        mimeType: 'image/png',
      },
    ]);
  });

  it('rejects empty uploads', () => {
    expect(() =>
      validateLotImageUploads([
        {
          buffer: Buffer.alloc(0),
          mimetype: 'image/png',
        },
      ]),
    ).toThrow(BadRequestException);
  });

  it('rejects files whose claimed mime type does not match the contents', () => {
    expect(() =>
      validateLotImageUploads([
        {
          buffer: pngBuffer,
          mimetype: 'image/jpeg',
        },
      ]),
    ).toThrow('Image MIME type does not match file contents');
  });

  it('rejects unsupported signatures such as svg payloads', () => {
    expect(() =>
      validateLotImageUploads([
        {
          buffer: Buffer.from('<svg viewBox="0 0 1 1"></svg>'),
          mimetype: 'image/svg+xml',
        },
      ]),
    ).toThrow('Unsupported image type');
  });
});

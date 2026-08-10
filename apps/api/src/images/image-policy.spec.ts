import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  assertProductImageCapacity,
  detectImageMimeType,
  productImageUploadLimits,
  validateProductImageUploads,
} from './image-policy';

let pngBuffer = Buffer.alloc(0);
const corruptedPngBuffer = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32, 0),
]);

beforeAll(async () => {
  pngBuffer = await sharp({
    create: {
      width: 1,
      height: 1,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .png()
    .toBuffer();
});

describe('image policy', () => {
  it('enforces image count across existing and incoming files', () => {
    const existing = Array.from(
      { length: productImageUploadLimits.maxFiles },
      () => ({ byteLength: 1 }),
    );

    expect(() =>
      assertProductImageCapacity(existing, [{ byteLength: 1 }]),
    ).toThrow(
      `A Product can have at most ${productImageUploadLimits.maxFiles} images`,
    );
  });

  it('enforces total bytes across existing and incoming files', () => {
    expect(() =>
      assertProductImageCapacity(
        [{ byteLength: productImageUploadLimits.maxTotalBytes }],
        [{ byteLength: 1 }],
      ),
    ).toThrow(
      `A Product cannot exceed ${productImageUploadLimits.maxTotalBytes} total image bytes`,
    );
  });

  it('detects supported image signatures', () => {
    expect(detectImageMimeType(pngBuffer)).toBe('image/png');
  });

  it('normalizes validated uploads to detected mime types', async () => {
    await expect(
      validateProductImageUploads([
        {
          buffer: pngBuffer,
          mimetype: 'image/png',
        },
      ]),
    ).resolves.toEqual([
      {
        buffer: pngBuffer,
        mimeType: 'image/png',
      },
    ]);
  });

  it('rejects empty uploads', async () => {
    await expect(
      validateProductImageUploads([
        {
          buffer: Buffer.alloc(0),
          mimetype: 'image/png',
        },
      ]),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects files whose claimed mime type does not match the contents', async () => {
    await expect(
      validateProductImageUploads([
        {
          buffer: pngBuffer,
          mimetype: 'image/jpeg',
        },
      ]),
    ).rejects.toThrow('Image MIME type does not match file contents');
  });

  it('rejects unsupported signatures such as svg payloads', async () => {
    await expect(
      validateProductImageUploads([
        {
          buffer: Buffer.from('<svg viewBox="0 0 1 1"></svg>'),
          mimetype: 'image/svg+xml',
        },
      ]),
    ).rejects.toThrow('Unsupported image type');
  });

  it('rejects corrupted raster payloads even when the signature matches', async () => {
    await expect(
      validateProductImageUploads([
        {
          buffer: corruptedPngBuffer,
          mimetype: 'image/png',
        },
      ]),
    ).rejects.toThrow('image/png payload is corrupted or not decodable');
  });
});

import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  assertProductImageCapacity,
  acceptSupportedUploadMimeType,
  detectImageMimeType,
  getImageCacheControl,
  productImagePixelBudgets,
  productImageUploadLimits,
  validateAndNormalizeProductImageUploads,
} from './image-policy';

let pngBuffer = Buffer.alloc(0);
let staticWebpBuffer = Buffer.alloc(0);
const animatedWebpBuffer = Buffer.from(
  'UklGRroAAABXRUJQVlA4WAoAAAACAAAAAQAAAQAAQU5JTQYAAAD/////AABBTk1GRgAAAAAAAAAAAAEAAAEAAEYAAAJWUDggLgAAAPABAJ0BKgIAAgABQCYliAJ0ugADCQb7gAD++5bCe9sfP8OVPp2d36FGyiXzAABBTk1GQAAAAAAAAAAAAAAAAAAAAAIDAABWUDggKAAAAJQBAJ0BKgEAAQAAACYliAJ0ugADmAD+8iJf1difCfoPxW+oGaQAAAA=',
  'base64',
);
const corruptedPngBuffer = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32, 0),
]);
const gifBuffer = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\x00\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');

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

  staticWebpBuffer = await sharp({
    create: {
      width: 2,
      height: 2,
      channels: 3,
      background: { r: 0, g: 128, b: 255 },
    },
  })
    .webp()
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
    expect(detectImageMimeType(gifBuffer)).toBeNull();
  });

  it('rejects unsupported upload MIME types before reading bytes', () => {
    const done = vi.fn();
    acceptSupportedUploadMimeType('image/gif', done);
    expect(done).toHaveBeenCalledWith(expect.any(BadRequestException), false);
    done.mockClear();
    acceptSupportedUploadMimeType('image/png', done);
    expect(done).toHaveBeenCalledWith(null, true);
  });

  it('normalizes validated uploads to canonical static bytes', async () => {
    const [validated] = await validateAndNormalizeProductImageUploads([
      {
        buffer: pngBuffer,
        mimetype: 'image/png',
      },
    ]);

    expect(validated.mimeType).toBe('image/png');
    expect(validated.width).toBe(1);
    expect(validated.height).toBe(1);
    expect(validated.buffer).toBeInstanceOf(Buffer);
    expect(validated.buffer.byteLength).toBeGreaterThan(0);
  });

  it('rejects gif uploads', async () => {
    await expect(
      validateAndNormalizeProductImageUploads([
        {
          buffer: gifBuffer,
          mimetype: 'image/gif',
        },
      ]),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts static webp uploads and normalizes to jpeg', async () => {
    const [validated] = await validateAndNormalizeProductImageUploads([
      {
        buffer: staticWebpBuffer,
        mimetype: 'image/webp',
      },
    ]);

    expect(validated.mimeType).toBe('image/jpeg');
    expect(validated.width).toBe(2);
    expect(validated.height).toBe(2);
  });

  it('rejects animated webp uploads', async () => {
    await expect(
      validateAndNormalizeProductImageUploads([
        {
          buffer: animatedWebpBuffer,
          mimetype: 'image/webp',
        },
      ]),
    ).rejects.toThrow('Animated images are not supported');
  });

  it('rejects oversized dimensions', async () => {
    const oversized = await sharp({
      create: {
        width: productImagePixelBudgets.maxEdgePx + 1,
        height: 1,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await expect(
      validateAndNormalizeProductImageUploads([
        {
          buffer: oversized,
          mimetype: 'image/png',
        },
      ]),
    ).rejects.toThrow(
      `Image dimensions cannot exceed ${productImagePixelBudgets.maxEdgePx}px on either edge`,
    );
  });

  it('rejects empty uploads', async () => {
    await expect(
      validateAndNormalizeProductImageUploads([
        {
          buffer: Buffer.alloc(0),
          mimetype: 'image/png',
        },
      ]),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects files whose claimed mime type does not match the contents', async () => {
    await expect(
      validateAndNormalizeProductImageUploads([
        {
          buffer: pngBuffer,
          mimetype: 'image/jpeg',
        },
      ]),
    ).rejects.toThrow('Image MIME type does not match file contents');
  });

  it('rejects unsupported signatures such as svg payloads', async () => {
    await expect(
      validateAndNormalizeProductImageUploads([
        {
          buffer: Buffer.from('<svg viewBox="0 0 1 1"></svg>'),
          mimetype: 'image/svg+xml',
        },
      ]),
    ).rejects.toThrow('Unsupported image type');
  });

  it('rejects corrupted raster payloads even when the signature matches', async () => {
    await expect(
      validateAndNormalizeProductImageUploads([
        {
          buffer: corruptedPngBuffer,
          mimetype: 'image/png',
        },
      ]),
    ).rejects.toThrow('image/png payload is corrupted or not decodable');
  });

  it.each([
    [
      { isPublic: false, kind: 'product' as const },
      'private, no-store',
    ],
    [
      { isPublic: false, kind: 'seller-photo' as const },
      'private, no-store',
    ],
    [
      { isPublic: false, kind: 'creation-step' as const },
      'private, no-store',
    ],
    [
      { isPublic: true, kind: 'product' as const },
      'public, max-age=31536000, immutable',
    ],
    [
      { isPublic: true, kind: 'seller-photo' as const },
      'public, max-age=0, must-revalidate',
    ],
    [
      { isPublic: true, kind: 'creation-step' as const },
      'public, max-age=0, must-revalidate',
    ],
  ])('selects cache control for %j', (input, expected) => {
    expect(getImageCacheControl(input)).toBe(expected);
  });
});

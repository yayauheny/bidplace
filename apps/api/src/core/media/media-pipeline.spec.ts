import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { SharpImageProcessor } from './media-pipeline';
import { mediaChecksum } from './media-object-store';
const processor = new SharpImageProcessor();

describe('media pipeline', () => {
  it('preserves SOURCE bytes and strips metadata from bounded sRGB WebP derivatives', async () => {
    const source = await sharp({
      create: {
        width: 1800,
        height: 900,
        channels: 4,
        background: '#33aaff88',
      },
    })
      .png()
      .withMetadata({ orientation: 6 })
      .withExif({
        IFD0: { Artist: 'Private author' },
        IFD3: { GPSLatitude: '53/1 54/1 0/1', GPSLongitude: '27/1 34/1 0/1' },
      })
      .toBuffer();
    const result = await processor.process(
      { buffer: source, mimetype: 'image/png' },
      'WORK_IMAGE',
    );
    expect(result[0]?.bytes).toEqual(source);
    expect(result[0]?.sha256).toBe(mediaChecksum(source));
    expect(result.map((x) => x.variant)).toEqual(['SOURCE', 'PREVIEW', 'FULL']);
    for (const image of result.slice(1)) {
      const meta = await sharp(image.bytes).metadata();
      expect(meta.format).toBe('webp');
      expect(meta.exif).toBeUndefined();
      expect(meta.icc).toBeUndefined();
      expect(meta.orientation).toBeUndefined();
      expect(meta.hasAlpha).toBe(true);
      expect(Math.max(image.width, image.height)).toBeLessThanOrEqual(
        image.variant === 'PREVIEW' ? 1600 : 3840,
      );
    }
  });
  it.each(['AUTHOR_PHOTO', 'ACHIEVEMENT'] as const)(
    'does not generate FULL or upscale %s',
    async (purpose) => {
      const source = await sharp({
        create: { width: 20, height: 10, channels: 3, background: 'red' },
      })
        .jpeg()
        .toBuffer();
      const result = await processor.process(
        { buffer: source, mimetype: 'image/jpeg' },
        purpose,
      );
      expect(result.map((x) => x.variant)).toEqual(['SOURCE', 'PREVIEW']);
      expect(result[1]?.width).toBe(20);
    },
  );
  it.each([3, 7, 20])(
    'accepts a %i MiB Work input and stores a master below 5 MiB',
    async (size) => {
      const png = await sharp({
        create: { width: 1200, height: 800, channels: 3, background: 'blue' },
      })
        .png()
        .toBuffer();
      const input = Buffer.concat([
        png,
        Buffer.alloc(size * 1024 * 1024 - png.length),
      ]);
      const images = await processor.process(
        { buffer: input, mimetype: 'image/png' },
        'WORK_IMAGE',
      );
      expect(images[0]!.bytes.length).toBeLessThanOrEqual(5 * 1024 * 1024);
      expect(images[0]!.width).toBe(1200);
      expect(
        (await sharp(images[0]!.bytes).raw().toBuffer()).equals(
          await sharp(png).raw().toBuffer(),
        ),
      ).toBe(true);
    },
  );

  it('automatically reduces a noisy transparent image without flattening its alpha', async () => {
    const png = await sharp(randomBytes(2300 * 2300 * 4), {
      raw: { width: 2300, height: 2300, channels: 4 },
    })
      .png({ compressionLevel: 0 })
      .toBuffer();
    const images = await processor.process(
      { buffer: png, mimetype: 'image/png' },
      'WORK_IMAGE',
    );
    const source = images[0]!;
    expect(source.bytes.length).toBeLessThanOrEqual(5 * 1024 * 1024);
    expect((await sharp(source.bytes).metadata()).hasAlpha).toBe(true);
    expect(source.width).toBeLessThanOrEqual(2300);
    expect(source.sha256).toBe(mediaChecksum(source.bytes));
    const restored = await processor.process(
      { buffer: source.bytes, mimetype: source.mimeType },
      'WORK_IMAGE',
      true,
    );
    expect(restored.map((image) => image.sha256)).toEqual(
      images.map((image) => image.sha256),
    );
  }, 30_000);

  it('rejects the input byte ceiling and keeps the story input contract at 5 MiB', async () => {
    await expect(
      processor.process(
        { buffer: Buffer.alloc(25 * 1024 * 1024 + 1), mimetype: 'image/png' },
        'WORK_IMAGE',
      ),
    ).rejects.toThrow('26214400 bytes');
    await expect(
      processor.process(
        { buffer: Buffer.alloc(5 * 1024 * 1024 + 1), mimetype: 'image/png' },
        'STORY_IMAGE',
      ),
    ).rejects.toThrow('5242880 bytes');
  });

  it('rejects mismatched MIME and corrupt payloads', async () => {
    await expect(
      processor.process(
        { buffer: Buffer.from('broken image'), mimetype: 'image/jpeg' },
        'WORK_IMAGE',
      ),
    ).rejects.toThrow('Unsupported image type');
  });
});

import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { SharpImageProcessor } from './media-pipeline';
import { mediaChecksum } from './media-object-store';
const processor = new SharpImageProcessor();

describe('media pipeline', () => {
  it.each(['jpeg', 'png', 'webp'] as const)(
    'decodes %s, applies orientation, strips private metadata and reproduces derivatives',
    async (format) => {
      const input = await sharp({
        create: {
          width: 24,
          height: 40,
          channels: format === 'jpeg' ? 3 : 4,
          background: { r: 45, g: 120, b: 190, alpha: 0.5 },
        },
      })
        .toFormat(format)
        .withMetadata({ orientation: 6 })
        .withExif({ IFD0: { Artist: 'Private author' } })
        .toBuffer();
      const images = await processor.process(
        { buffer: input, mimetype: `image/${format}` },
        'WORK_IMAGE',
      );
      const master = images[0]!;
      expect(master.bytes.length).toBeLessThanOrEqual(5 * 1024 * 1024);
      expect(master.sha256).toBe(mediaChecksum(master.bytes));
      for (const image of images.slice(1)) {
        const metadata = await sharp(image.bytes).metadata();
        expect(metadata.format).toBe('webp');
        expect([metadata.width, metadata.height]).toEqual([40, 24]);
        expect(metadata.hasAlpha).toBe(format !== 'jpeg');
        expect(metadata.exif).toBeUndefined();
        expect(metadata.icc).toBeUndefined();
        expect(metadata.orientation).toBeUndefined();
        const pixels = await sharp(image.bytes).ensureAlpha().raw().toBuffer();
        expect(pixels.length).toBe(40 * 24 * 4);
        expect(pixels[3]).toBe(format === 'jpeg' ? 255 : 128);
      }
      const recovered = await processor.process(
        { buffer: master.bytes, mimetype: master.mimeType },
        'WORK_IMAGE',
        true,
      );
      expect(recovered.map((image) => image.sha256)).toEqual(
        images.map((image) => image.sha256),
      );
    },
  );

  it.each(['jpeg', 'webp'] as const)(
    'automatically compresses an actual oversized %s payload',
    async (format) => {
      const edge = format === 'jpeg' ? 2600 : 1400;
      const channels = format === 'jpeg' ? 3 : 4;
      const input = await sharp(randomBytes(edge * edge * channels), {
        raw: { width: edge, height: edge, channels },
      })
        .toFormat(
          format,
          format === 'jpeg' ? { quality: 100 } : { lossless: true },
        )
        .toBuffer();
      expect(input.length).toBeGreaterThan(5 * 1024 * 1024);
      expect(input.length).toBeLessThanOrEqual(25 * 1024 * 1024);
      const [master] = await processor.process(
        { buffer: input, mimetype: `image/${format}` },
        'WORK_IMAGE',
      );
      expect(master!.bytes.length).toBeLessThanOrEqual(5 * 1024 * 1024);
      expect(master!.width).toBeLessThanOrEqual(edge);
      expect(master!.width).toBeGreaterThanOrEqual(Math.min(edge, 1600));
      expect((await sharp(master!.bytes).metadata()).hasAlpha).toBe(
        format === 'webp',
      );
      await expect(sharp(master!.bytes).raw().toBuffer()).resolves.toBeInstanceOf(
        Buffer,
      );
    },
    30_000,
  );

  it.each(['jpeg', 'png', 'webp'] as const)(
    'rejects truncated %s and a MIME claim that differs from its contents',
    async (format) => {
      const buffer = await sharp({
        create: { width: 20, height: 10, channels: 3, background: 'red' },
      })
        .toFormat(format)
        .toBuffer();
      await expect(
        processor.process(
          { buffer: buffer.subarray(0, 12), mimetype: `image/${format}` },
          'WORK_IMAGE',
        ),
      ).rejects.toThrow('corrupted or not decodable');
      await expect(
        processor.process(
          { buffer, mimetype: format === 'png' ? 'image/jpeg' : 'image/png' },
          'WORK_IMAGE',
        ),
      ).rejects.toThrow('MIME type does not match');
    },
  );

  it('keeps compact 16-bit PNG samples intact', async () => {
    const source = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#83a6c9' } })
      .toColourspace('rgb16').png().toBuffer();
    const [master] = await processor.process({ buffer: source, mimetype: 'image/png' }, 'WORK_IMAGE');
    expect(master!.bytes.equals(source)).toBe(true);
    expect((await sharp(master!.bytes).metadata()).bitsPerSample).toBe(16);
  });

  it.each(['WORK_IMAGE', 'STORY_IMAGE'] as const)('accepts a 48MP phone photo for %s and bounds the stored master to 4096px', async (purpose) => {
    const source = await sharp({ create: { width: 8064, height: 6048, channels: 3, background: '#83a6c9' } }).jpeg().toBuffer();
    const [master] = await processor.process({ buffer: source, mimetype: 'image/jpeg' }, purpose);
    expect(master!.width).toBe(4096);
    expect(master!.height).toBe(3072);
    expect(master!.bytes.length).toBeLessThanOrEqual(5 * 1024 * 1024);
  });

  it.each(['WORK_IMAGE', 'STORY_IMAGE'] as const)('rejects %s inputs beyond the source edge ceiling', async (purpose) => {
    const source = await sharp({ create: { width: 8193, height: 10, channels: 3, background: 'red' } }).png().toBuffer();
    await expect(processor.process({ buffer: source, mimetype: 'image/png' }, purpose)).rejects.toThrow('8192px');
  });
  it('accepts a 12MP story phone photo', async () => {
    const buffer = await sharp({ create: { width: 4032, height: 3024, channels: 3, background: 'blue' } }).jpeg().toBuffer();
    const [master] = await processor.process({ buffer, mimetype: 'image/jpeg' }, 'STORY_IMAGE');
    expect([master!.width, master!.height]).toEqual([4032, 3024]);
  });

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
    expect(source.width).toBeGreaterThanOrEqual(1600);
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

  it('rejects the input byte ceiling and keeps the story input contract at 10 MiB', async () => {
    await expect(
      processor.process(
        { buffer: Buffer.alloc(25 * 1024 * 1024 + 1), mimetype: 'image/png' },
        'WORK_IMAGE',
      ),
    ).rejects.toThrow('26214400 bytes');
    await expect(
      processor.process(
        { buffer: Buffer.alloc(10 * 1024 * 1024 + 1), mimetype: 'image/png' },
        'STORY_IMAGE',
      ),
    ).rejects.toThrow('10485760 bytes');
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

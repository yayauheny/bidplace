import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { buildMediaPipeline } from './media-pipeline';
import { mediaChecksum } from './media-object-store';
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
    const result = await buildMediaPipeline(
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
      const result = await buildMediaPipeline(
        { buffer: source, mimetype: 'image/jpeg' },
        purpose,
      );
      expect(result.map((x) => x.variant)).toEqual(['SOURCE', 'PREVIEW']);
      expect(result[1]?.width).toBe(20);
    },
  );
  it('rejects mismatched MIME and corrupt payloads', async () => {
    await expect(
      buildMediaPipeline(
        { buffer: Buffer.from('broken image'), mimetype: 'image/jpeg' },
        'WORK_IMAGE',
      ),
    ).rejects.toThrow('Unsupported image type');
  });
});

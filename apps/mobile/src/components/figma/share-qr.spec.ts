import { describe, expect, it } from 'vitest';

import {
  canonicalizeShareUrl,
  encodeShareQrSvg,
  SHARE_QR_SIZE,
  shareQrSlotStyle,
} from './share-qr';

describe('share QR', () => {
  it('rejects an empty share URL', () => {
    expect(() => canonicalizeShareUrl('  ')).toThrow('share-url-empty');
  });

  it('uses the captured 164 px slot instead of a screenshot raster', () => {
    expect(SHARE_QR_SIZE).toBe(164);
    expect(shareQrSlotStyle()).toMatchObject({
      width: 164,
      height: 164,
      backgroundColor: '#d9d9d9',
    });
  });

  it('encodes distinct canonical URLs as real QR SVG', async () => {
    const first = await encodeShareQrSvg('https://bidplace.example/authors/vex');
    const second = await encodeShareQrSvg(
      'https://bidplace.example/works/abcdefghijk',
    );

    expect(first).toContain('<svg');
    expect(second).toContain('<svg');
    expect(first).not.toBe(second);
  });
});

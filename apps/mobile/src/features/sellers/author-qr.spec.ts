import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

import { canonicalShareUrl } from '../../lib/canonical-share-url';

describe('author QR', () => {
  it('decodes to the same public author URL used for copying', () => {
    const url = canonicalShareUrl('/authors/olga-vlasova', 'https://bidplace.example');
    const { modules } = QRCode.create(url, { errorCorrectionLevel: 'M' });
    const scale = 4;
    const size = (modules.size + 8) * scale;
    const pixels = new Uint8ClampedArray(size * size * 4).fill(255);
    for (let y = 0; y < modules.size; y++) {
      for (let x = 0; x < modules.size; x++) {
        if (!modules.get(y, x)) continue;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const offset = (((y + 4) * scale + dy) * size + (x + 4) * scale + dx) * 4;
            pixels.fill(0, offset, offset + 3);
          }
        }
      }
    }
    expect(jsQR(pixels, size, size)?.data).toBe(url);
  });
});

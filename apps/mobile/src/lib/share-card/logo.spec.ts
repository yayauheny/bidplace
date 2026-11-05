/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { sizedLogoSvg } from './logo';

describe('share logo rasterization', () => {
  it('preserves the vector viewBox while sizing the source to output pixels', () => {
    const original = '<svg xmlns="http://www.w3.org/2000/svg" width="164.85" height="53.4545" viewBox="0 0 164.85 53.4545"><path d="M0 0L1 1"/></svg>';
    const svg = new DOMParser().parseFromString(sizedLogoSvg(original, 1080), 'image/svg+xml').documentElement;
    expect(svg.getAttribute('width')).toBe('1080');
    expect(Number(svg.getAttribute('height'))).toBe(Math.ceil(1080 * 53.4545 / 164.85));
    expect(svg.getAttribute('viewBox')).toBe('0 0 164.85 53.4545');
    expect(svg.querySelector('path')?.getAttribute('d')).toBe('M0 0L1 1');
  });
});

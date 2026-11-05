import { describe, expect, it } from 'vitest';
import { canvasSize, fitImage, fitCroppedImage, pillFontSize, textFontSize, textLineLimit, wrapText } from './layout';

describe('share card layout', () => {
  it('sizes each format and preserves original aspect without upscaling', () => {
    expect(canvasSize('story')).toEqual({ width: 1080, height: 1920 });
    expect(canvasSize('post')).toEqual({ width: 1080, height: 1350 });
    expect(canvasSize('square')).toEqual({ width: 1080, height: 1080 });
    expect(canvasSize('original', { width: 3000, height: 2000 })).toEqual({ width: 2048, height: 1365 });
    expect(canvasSize('original', { width: 500, height: 1000 })).toEqual({ width: 500, height: 1000 });
    expect(() => canvasSize('original', { width: 0, height: 1 })).toThrow();
  });

  it('centres wide and tall photos when cropping or fitting', () => {
    const box = { x: 0, y: 0, w: 100, h: 100 };
    expect(fitImage('cover', { width: 200, height: 100 }, box)).toEqual({ sx: 50, sy: 0, sw: 100, sh: 100, dx: 0, dy: 0, dw: 100, dh: 100 });
    expect(fitImage('cover', { width: 100, height: 200 }, box)).toEqual({ sx: 0, sy: 50, sw: 100, sh: 100, dx: 0, dy: 0, dw: 100, dh: 100 });
    expect(fitImage('contain', { width: 200, height: 100 }, box)).toEqual({ sx: 0, sy: 0, sw: 200, sh: 100, dx: 0, dy: 25, dw: 100, dh: 50 });
  });

  it('wraps words, splits long words and clips the final line with an ellipsis', () => {
    const measure = (text: string) => Array.from(text).length;
    expect(wrapText(measure, 'one two three', 7, 2)).toEqual(['one two', 'three']);
    expect(wrapText(measure, 'abcdefghijk', 4, 2)).toEqual(['abcd', 'efg…']);
    expect(wrapText(measure, 'one two three four', 7, 2)).toEqual(['one two', 'three…']);
    expect(wrapText(measure, '', 10, 2)).toEqual([]);
    const shaped = (value: string) => value === '👩‍💻' ? 1 : Array.from(value).length;
    expect(wrapText(shaped, '👩‍💻x', 1, 2)).toEqual(['👩‍💻', 'x']);
    expect(() => wrapText(measure, 'a', 0.5, 1)).toThrow();
    expect(() => fitImage('cover', { width: Number.NaN, height: 2 }, { x: 0, y: 0, w: 10, h: 10 })).toThrow();
  });
});

it('uses the published crop before fitting a non-original card', () => {
  expect(fitCroppedImage('cover', { width: 1000, height: 800 }, { x: 0, y: 0, w: 100, h: 100 }, { x: 0.5, y: 0.25, width: 0.4, height: 0.5 })).toMatchObject({ sx: 500, sy: 200, sw: 400, sh: 400 });
});

it('fits original card labels inside a wide image or reports insufficient space', () => {
  const font = pillFontSize(2000, 500, 4, 800);
  expect(500 + font * 1.8 * 1.12 * 4).toBeLessThanOrEqual(800);
  expect(() => pillFontSize(2000, 80, 4, 96)).toThrow();
});

it('limits description lines before the following link', () => {
  expect(textLineLimit(3, 140, 96.2)).toBe(1);
  expect(textLineLimit(3, 300, 96.2)).toBe(3);
  expect(() => textLineLimit(3, 20, 96)).toThrow();
});

it('keeps the link readable within the last row of a horizontal original', () => {
  const font = textFontSize(2000, 0.025, 60);
  expect(font * 1.3).toBeLessThanOrEqual(60);
  expect(font).toBeGreaterThan(16);
});

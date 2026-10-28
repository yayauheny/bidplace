import { describe, expect, it } from 'vitest';
import { figmaIconStrokeWidth } from './figma-icon-style';

describe('Figma icon stroke widths', () => {
  it.each([12, 16, 18, 20])(
    'keeps regular icons at 1.3 physical px at size %s',
    (size) => {
      expect(figmaIconStrokeWidth(size)).toBeCloseTo(1.3);
    },
  );
  it.each([24, 32, 48])(
    'keeps large icons at 1.6 physical px at size %s',
    (size) => {
      expect(figmaIconStrokeWidth(size)).toBeCloseTo(1.6);
    },
  );
});

import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  StyleSheet: {
    flatten: (style: unknown) => {
      if (!Array.isArray(style)) return style;

      return Object.assign({}, ...style.filter(Boolean));
    },
  },
}));

describe('FigmaGlassSurface web styles', () => {
  it('keeps React Native style arrays instead of dropping them', async () => {
    const { flattenWebViewStyle } = await import('./FigmaGlassSurface.web');

    expect(
      flattenWebViewStyle([
        { width: 232, opacity: 0.6 },
        false,
        { height: 64, opacity: 1 },
      ]),
    ).toEqual({ width: 232, height: 64, opacity: 1 });
  });
});

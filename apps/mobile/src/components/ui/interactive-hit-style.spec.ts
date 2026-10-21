import { describe, expect, it, vi } from 'vitest';

import { lightColorMap } from '@bidplace/design-tokens';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('interactive hit style', () => {
  it('uses token surfaces on native and skips dataset', async () => {
    const { interactiveHitDataset, interactiveHitFallbackStyle } =
      await import('./interactive-hit-style');
    expect(interactiveHitDataset()).toEqual({});
    expect(
      interactiveHitFallbackStyle({
        hovered: true,
        pressed: false,
        palette: lightColorMap,
      }),
    ).toMatchObject({
      backgroundColor: '#F7F7F7',
    });
  });
});

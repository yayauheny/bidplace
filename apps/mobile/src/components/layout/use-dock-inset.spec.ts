import { describe, expect, it, vi } from 'vitest';

vi.mock('./public-navigation', () => ({ useDesktopNavigation: () => false }));

import { dockInset } from './use-dock-inset';

describe('dockInset', () => {
  it.each([
    { safeBottom: 0, bottom: 12, reserve: 96 },
    { safeBottom: 34, bottom: 34, reserve: 118 },
  ])(
    'uses the greater of the gutter and safe-area bottom for $safeBottom',
    ({ safeBottom, bottom, reserve }) => {
      expect(dockInset(safeBottom)).toEqual({ bottom, reserve });
    },
  );
});

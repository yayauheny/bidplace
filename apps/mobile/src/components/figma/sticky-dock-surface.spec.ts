import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  STICKY_DOCK_SURFACE_EASING,
  stickyDockSurfaceStyle,
} from './sticky-dock-surface-style.web';

describe('sticky dock surface', () => {
  it('fills its host and fades opacity only', () => {
    const hidden = stickyDockSurfaceStyle(false, false);
    const shown = stickyDockSurfaceStyle(true, false);
    const reduced = stickyDockSurfaceStyle(true, true);
    expect(hidden).not.toHaveProperty('height');
    expect(hidden.position).toBe('absolute');
    expect(hidden.inset).toBe(0);
    expect(hidden.backgroundColor).toBe(designTokens.color.canvas);
    expect(hidden.opacity).toBe(0);
    expect(shown.opacity).toBe(1);
    expect(hidden.pointerEvents).toBe('none');
    expect(shown.transition).toContain(`${designTokens.motion.control}ms`);
    expect(shown.transition).toContain(STICKY_DOCK_SURFACE_EASING);
    expect(reduced.transition).toBe('none');
  });
});

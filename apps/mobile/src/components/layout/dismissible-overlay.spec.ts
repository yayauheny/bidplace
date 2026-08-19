import { describe, expect, it, vi } from 'vitest';

import {
  isEscapeKey,
  isNodeInsideSurfaces,
  shouldCloseOnPointerDown,
} from './dismissible-overlay';

describe('dismissible-overlay primitives', () => {
  it('detects Escape key', () => {
    expect(isEscapeKey({ key: 'Escape' } as KeyboardEvent)).toBe(true);
    expect(isEscapeKey({ key: 'Enter' } as KeyboardEvent)).toBe(false);
  });

  it('detects whether target is inside at least one surface', () => {
    const target = {} as unknown as EventTarget;
    const contains = vi.fn().mockReturnValue(true);
    const surface = { contains };

    expect(isNodeInsideSurfaces(target, [surface])).toBe(true);
    expect(contains).toHaveBeenCalled();
  });

  it('requests close when target is outside all surfaces', () => {
    const target = {} as unknown as EventTarget;
    const contains = vi.fn().mockReturnValue(false);
    const surface = { contains };

    expect(shouldCloseOnPointerDown(target, [surface])).toBe(true);
  });

  it('does not request close when target is inside any surface', () => {
    const target = {} as unknown as EventTarget;
    const contains = vi.fn().mockReturnValue(true);
    const surface = { contains };

    expect(shouldCloseOnPointerDown(target, [surface])).toBe(false);
  });
});


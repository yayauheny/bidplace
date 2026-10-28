import { describe, expect, it } from 'vitest';

import { gridColumnsFromWidth } from './grid-columns';

// Author Works4861:7803: four columns at the canonical1280px container.
const authorGrid = { minCardWidth: 264, gap: 12, max: 4 as const };

describe('gridColumnsFromWidth', () => {
  it('keeps a single column at 390', () => {
    expect(gridColumnsFromWidth(366, authorGrid)).toBe(1);
  });

  it('matches the old 700/1000 breakpoints', () => {
    expect(gridColumnsFromWidth(700, authorGrid)).toBe(2);
    expect(gridColumnsFromWidth(1000, authorGrid)).toBe(3);
  });

  it('fits four author cards at the canonical desktop container and clamps beyond it', () => {
    expect(gridColumnsFromWidth(1280, authorGrid)).toBe(4);
    expect(gridColumnsFromWidth(2560, authorGrid)).toBe(4);
  });

  it('falls back to one column before the first layout pass', () => {
    expect(gridColumnsFromWidth(0, authorGrid)).toBe(1);
  });

  it('keeps three category tiles across at the real 390 container', () => {
    // Контейнер шторки 390 − 2×12 = 366; (366 + 8) / (116 + 8) = 3.01.
    const categoryGrid = { minCardWidth: 116, gap: 8, max: 3 as const };
    expect(gridColumnsFromWidth(366, categoryGrid)).toBe(3);
    expect(gridColumnsFromWidth(320, categoryGrid)).toBe(2);
  });
});

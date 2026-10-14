import { describe, expect, it } from 'vitest';

import { gridColumnsFromWidth } from './grid-columns';

// Авторская сетка работ: gap 12 (space.x3), минимальная карточка 320.
// 390 → 1 колонка (карточка 366), поведение прежних брейкпоинтов 700/1000
// сохранено: 700 → 2, 1000 → 3.
const authorGrid = { minCardWidth: 320, gap: 12, max: 3 as const };

describe('gridColumnsFromWidth', () => {
  it('keeps a single column at 390', () => {
    expect(gridColumnsFromWidth(366, authorGrid)).toBe(1);
  });

  it('matches the old 700/1000 breakpoints', () => {
    expect(gridColumnsFromWidth(700, authorGrid)).toBe(2);
    expect(gridColumnsFromWidth(1000, authorGrid)).toBe(3);
  });

  it('clamps to max on wide containers', () => {
    expect(gridColumnsFromWidth(2560, authorGrid)).toBe(3);
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

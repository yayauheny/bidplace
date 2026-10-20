import { describe, expect, it } from 'vitest';
import { shouldDismissSheet } from './sheet-dismissal';

describe('sheet header dismissal intent', () => {
  it.each([
    ['tap', 0, 0, 0, false],
    ['short slow pull', 0, 20, 0.1, false],
    ['long downward pull', 5, 110, 0.1, true],
    ['intentional quick flick', 2, 30, 0.8, true],
    ['tiny fast motion', 0, 5, 2, false],
    ['horizontal swipe', 150, 90, 1, false],
    ['upward swipe', 0, -100, -1, false],
  ] as const)('%s', (_, dx, dy, velocity, expected) => {
    expect(shouldDismissSheet(dx, dy, velocity)).toBe(expected);
  });
});

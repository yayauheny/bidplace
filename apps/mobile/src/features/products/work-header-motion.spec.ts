import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import {
  WORK_HEADER_COLLAPSE_SCROLL,
  WORK_HEADER_EASING,
  WORK_HEADER_EXPAND_SCROLL,
  WORK_HEADER_TRANSITION_MS,
  workHeaderScrollTopFromEvent,
  workHeaderStateFromScroll,
  workProgressForHeaderState,
  workWebCompactStack,
} from './work-header-motion';

describe('work header motion helpers', () => {
  it('collapses when the title landmark reaches the top', () => {
    expect(WORK_HEADER_COLLAPSE_SCROLL).toBe(558);
    expect(WORK_HEADER_EXPAND_SCROLL).toBe(538);
    expect(WORK_HEADER_TRANSITION_MS).toBe(200);
    expect(WORK_HEADER_EASING).toBe('cubic-bezier(0.2, 0, 0, 1)');
    expect(workHeaderStateFromScroll(0, 'expanded')).toBe('expanded');
    expect(workHeaderStateFromScroll(557, 'expanded')).toBe('expanded');
    expect(workHeaderStateFromScroll(558, 'expanded')).toBe('compact');
    expect(workHeaderStateFromScroll(548, 'compact')).toBe('compact');
    expect(workHeaderStateFromScroll(539, 'compact')).toBe('compact');
    expect(workHeaderStateFromScroll(538, 'compact')).toBe('expanded');
    expect(workHeaderStateFromScroll(537, 'compact')).toBe('expanded');
    expect(workProgressForHeaderState('expanded')).toBe(0);
    expect(workProgressForHeaderState('compact')).toBe(1);
  });

  it('derives compact stack from tokens without a center thumbnail', () => {
    expect(workWebCompactStack()).toBe(80);
    expect(designTokens.space.x3).toBe(12);
    expect(designTokens.size.header).toBe(48);
    expect(designTokens.space.x5).toBe(20);
  });

  it('reads scrollTop only from the labeled vertical boundary', () => {
    const boundary = { scrollTop: 640 } as HTMLElement;
    const nested = { scrollTop: 0 } as HTMLElement;
    const leftover = { scrollTop: 0, scrollHeight: 42, clientHeight: 40 } as HTMLElement;
    expect(workHeaderScrollTopFromEvent({ target: boundary }, boundary)).toBe(
      640,
    );
    expect(workHeaderScrollTopFromEvent({ target: nested }, boundary)).toBeNull();
    expect(
      workHeaderScrollTopFromEvent({ target: leftover }, boundary),
    ).toBeNull();
  });
});

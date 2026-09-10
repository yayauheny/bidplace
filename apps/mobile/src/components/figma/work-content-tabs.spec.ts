import { describe, expect, it } from 'vitest';

import {
  getWorkContentTabAt,
  resolveWorkContentTab,
  visibleWorkContentTabs,
} from './work-content-tabs';

describe('work content tabs', () => {
  it('hides История when there is no story', () => {
    expect(visibleWorkContentTabs(false).map((tab) => tab.id)).toEqual([
      'details',
    ]);
    expect(visibleWorkContentTabs(true).map((tab) => tab.id)).toEqual([
      'story',
      'details',
    ]);
  });

  it('selects the panel from state instead of the Figma underline mismatch', () => {
    expect(resolveWorkContentTab('story', false)).toBe('details');
    expect(resolveWorkContentTab('story', true)).toBe('story');
    expect(resolveWorkContentTab('details', true)).toBe('details');
    expect(getWorkContentTabAt(0, true)).toBe('story');
    expect(getWorkContentTabAt(1, true)).toBe('details');
  });
});

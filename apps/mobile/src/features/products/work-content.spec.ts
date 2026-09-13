import { describe, expect, it } from 'vitest';
import { resolveWorkTab, workTabs } from './work-content';
describe('work content tabs', () => {
  it.each([null, '', '   '])(
    'omits an empty story and resolves its deep link to details',
    (story) => {
      expect(workTabs(story).map((tab) => tab.value)).toEqual([
        'details',
        'delivery',
      ]);
      expect(resolveWorkTab(story, 'story')).toBe('details');
    },
  );
  it('keeps an explicit panel and defaults to a populated story', () => {
    expect(resolveWorkTab('Story')).toBe('story');
    expect(resolveWorkTab('Story', 'details')).toBe('details');
    expect(resolveWorkTab('Story', 'delivery')).toBe('delivery');
  });
});

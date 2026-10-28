import { describe, expect, it } from 'vitest';
import type { StoryBlock } from '@bidplace/contracts';

import { resolveWorkTab, workTabs } from './work-content';

const imageOnly: StoryBlock[] = [{
  id: '81111111-1111-4111-8111-111111111111',
  type: 'IMAGE',
  position: 0,
  mediaAssetId: '82222222-2222-4222-8222-222222222222',
}];

describe('Work story tab', () => {
  it('hides an empty story and resolves its deep link to details', () => {
    expect(workTabs([]).map((tab) => tab.value)).toEqual(['details', 'delivery']);
    expect(resolveWorkTab([], 'story')).toBe('details');
  });

  it('shows IMAGE-only stories and honors an explicit non-story tab', () => {
    expect(workTabs(imageOnly).map((tab) => tab.value)).toEqual([
      'story',
      'details',
      'delivery',
    ]);
    expect(resolveWorkTab(imageOnly)).toBe('story');
    expect(resolveWorkTab(imageOnly, 'details')).toBe('details');
    expect(resolveWorkTab(imageOnly, 'delivery')).toBe('delivery');
  });
});

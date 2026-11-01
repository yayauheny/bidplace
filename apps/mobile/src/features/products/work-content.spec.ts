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
    expect(workTabs([], false).map((tab) => tab.value)).toEqual(['details']);
    expect(resolveWorkTab([], 'story', false)).toBe('details');
    expect(resolveWorkTab([], 'delivery', false)).toBe('details');
  });

  it('shows IMAGE-only stories and honors an explicit non-story tab', () => {
    expect(workTabs(imageOnly, false).map((tab) => tab.value)).toEqual([
      'story',
      'details',
    ]);
    expect(workTabs(imageOnly, true).map((tab) => tab.label)).toEqual([
      'История',
      'Детали',
      'Как проходит сделка',
    ]);
    expect(resolveWorkTab(imageOnly, undefined, false)).toBe('story');
    expect(resolveWorkTab(imageOnly, 'details', false)).toBe('details');
    expect(resolveWorkTab(imageOnly, 'delivery', true)).toBe('delivery');
    expect(resolveWorkTab(imageOnly, 'delivery', false)).toBe('story');
  });
});

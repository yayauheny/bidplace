import { describe, expect, it } from 'vitest';
import { resolveWorkTab, workHistoryBlocks, workTabs } from './work-content';
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

describe('workHistoryBlocks', () => {
  const cover = { id: 'cover', url: '/api/images/cover' };
  const detail = { id: 'detail', url: '/api/images/detail' };
  const process = { id: 'process', url: '/api/images/process' };

  it('interleaves story paragraphs with non-cover gallery images', () => {
    expect(
      workHistoryBlocks('First paragraph.\n\nSecond paragraph.', [
        cover,
        detail,
        process,
      ]),
    ).toEqual([
      { type: 'text', text: 'First paragraph.' },
      { type: 'image', image: detail },
      { type: 'text', text: 'Second paragraph.' },
      { type: 'image', image: process },
    ]);
  });

  it('keeps text-only history when the gallery has only a cover', () => {
    expect(workHistoryBlocks('Only text.', [cover])).toEqual([
      { type: 'text', text: 'Only text.' },
    ]);
  });

  it('never places the cover image in History', () => {
    expect(
      workHistoryBlocks('Only text.', [cover, detail]).map((block) =>
        block.type === 'image' ? block.image.id : block.text,
      ),
    ).toEqual(['Only text.', 'detail']);
  });
});

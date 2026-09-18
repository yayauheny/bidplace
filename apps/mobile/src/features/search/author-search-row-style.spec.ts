import { describe, expect, it } from 'vitest';

import { authorSearchRowStyle } from './author-search-row-style';

describe('authorSearchRowStyle', () => {
  it('is a horizontal flex row so Link asChild cannot collapse to a stack', () => {
    const style = authorSearchRowStyle();
    expect(style.display).toBe('flex');
    expect(style.flexDirection).toBe('row');
    expect(style.alignItems).toBe('center');
  });
});

import { describe, expect, it } from 'vitest';

import { getCreatorHeroContent } from './creator-hero';

describe('creator hero content', () => {
  it('builds a public handle and drops empty tags', () => {
    expect(
      getCreatorHeroContent({
        fullName: 'Vex',
        slug: 'vex',
        city: 'Минск',
        tags: ['керамика', ''],
      }),
    ).toEqual({
      fullName: 'Vex',
      handle: '@vex',
      city: 'Минск',
      tags: ['керамика'],
    });
  });
});

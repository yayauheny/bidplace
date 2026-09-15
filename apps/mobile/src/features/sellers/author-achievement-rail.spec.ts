import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import { authorAchievementRailSpec } from './author-achievement-rail';

describe('Author achievement rail', () => {
  it('uses Frame 219 marker and line on the phone about cards', () => {
    expect(authorAchievementRailSpec()).toEqual({
      sourceNodeId: '742:20510',
      markerNodeId: '744:20554',
      pageNodeId: '621:19578',
      dateNodeId: '621:19580',
      row: 14,
      marker: 14,
      markerHole: 10,
      markerPad: 3,
      markerRadius: 21,
      markerFill: '#565656',
      markerHoleFill: figmaTokens.color.white,
      lineHeight: 2,
      lineColor: '#565656',
      lineRadius: 6,
      imageRadius: 18.82,
      imageAspect: 3 / 4,
    });
  });
});

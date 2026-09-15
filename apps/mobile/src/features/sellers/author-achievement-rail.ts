import { figmaTokens } from '@bidplace/design-tokens';

export function authorAchievementRailSpec() {
  return {
    sourceNodeId: '742:20510',
    markerNodeId: '744:20554',
    pageNodeId: '621:19578',
    dateNodeId: '621:19580',
    row: 14,
    marker: 14,
    markerHole: 10,
    markerPad: 3,
    markerRadius: 21,
    markerFill: figmaTokens.color.tabInactive,
    markerHoleFill: figmaTokens.color.white,
    lineHeight: 2,
    lineColor: figmaTokens.color.tabInactive,
    lineRadius: 6,
    imageRadius: 18.82,
    imageAspect: 3 / 4,
  } as const;
}

import { figmaTokens } from '@bidplace/design-tokens';

export function filterSortBarStyle() {
  return {
    minHeight: figmaTokens.size.filterSortBar,
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: figmaTokens.space.x3,
  };
}

export function filterSortPillStyle() {
  return {
    minHeight: figmaTokens.size.filterSortPill,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: figmaTokens.space.x2,
    paddingLeft: figmaTokens.space.x2,
    paddingRight: figmaTokens.space.x4,
    paddingVertical: figmaTokens.space.x2,
  };
}

export function filterSortPillLabelStyle() {
  return {
    color: figmaTokens.color.ink,
  };
}

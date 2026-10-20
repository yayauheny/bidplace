import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export function filterSortBarStyle() {
  return {
    minHeight: designTokens.size.filterSortBar,
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: designTokens.space.x3,
  };
}

export function filterSortPillStyle() {
  return {
    minHeight: designTokens.size.filterSortPill,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.space.x2,
    paddingLeft: designTokens.space.x2,
    paddingRight: designTokens.space.x4,
    paddingVertical: designTokens.space.x2,
  };
}

export function filterSortPillLabelStyle(palette: SemanticColorMap) {
  return {
    color: palette.ink,
  };
}

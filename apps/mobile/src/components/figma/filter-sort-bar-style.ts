import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

// Figma 7245:2521: icon frame to label.
const filterLabelGap = 2;

export function filterSortBarStyle() {
  return {
    minHeight: designTokens.size.filterSortBar,
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: designTokens.space.x2,
  };
}

export function filterSortPillStyle() {
  return {
    minHeight: designTokens.size.filterSortPill,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: filterLabelGap,
    paddingLeft: designTokens.space.x4,
    paddingRight: designTokens.space.x4,
    paddingVertical: designTokens.space.x2,
  };
}

export function filterSortPillLabelStyle(palette: SemanticColorMap) {
  return {
    color: palette.textSubdued,
  };
}

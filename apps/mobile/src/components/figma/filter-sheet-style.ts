import { figmaTokens } from '@bidplace/design-tokens';

export function filterSheetPanelStyle(compact = false) {
  if (compact) {
    return {
      width: '100%' as const,
      maxWidth: figmaTokens.layout.phoneWidth,
      maxHeight: '78%' as const,
      paddingHorizontal: figmaTokens.space.x5,
      paddingTop: figmaTokens.space.x2,
      paddingBottom: figmaTokens.space.x5,
      borderTopLeftRadius: figmaTokens.radius.cover,
      borderTopRightRadius: figmaTokens.radius.cover,
      backgroundColor: figmaTokens.color.canvas,
      overflow: 'hidden' as const,
    };
  }
  return {
    width: '100%' as const,
    maxWidth: figmaTokens.layout.phoneWidth,
    height: '100%' as const,
    paddingHorizontal: figmaTokens.space.pageGutter,
    paddingTop: figmaTokens.space.x5,
    paddingBottom: figmaTokens.space.x5,
    backgroundColor: figmaTokens.color.canvas,
  };
}

export function filterSheetHeaderStyle(compact = false) {
  return {
    width: '100%' as const,
    minHeight: compact ? 43 : figmaTokens.size.touch,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: figmaTokens.space.x1,
  };
}

export function filterSheetTitleStyle() {
  return {
    flex: 1,
    minWidth: 0,
  };
}

export function filterSheetSectionRowStyle(compact = false) {
  return {
    width: '100%' as const,
    minHeight: compact ? 44 : figmaTokens.size.input,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: figmaTokens.space.identityGap,
    paddingBottom: compact ? 0 : figmaTokens.space.x3,
  };
}

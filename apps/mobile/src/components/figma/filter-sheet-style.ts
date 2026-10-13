import { figmaTokens } from '@bidplace/design-tokens';

export function filterSheetPanelStyle(compact = false) {
  return {
    width: '100%' as const,
    maxWidth: figmaTokens.layout.phoneWidth,
    ...(compact ? { borderTopLeftRadius: 32, borderTopRightRadius: 32 } : { height: '100%' as const }),
    paddingHorizontal: compact ? 20 : figmaTokens.space.pageGutter,
    paddingTop: compact ? 8 : figmaTokens.space.x5,
    paddingBottom: figmaTokens.space.x5,
    backgroundColor: figmaTokens.color.canvas,
  };
}

export function filterSheetHeaderStyle() {
  return {
    width: '100%' as const,
    minHeight: figmaTokens.size.touch,
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

export function filterSheetSectionRowStyle() {
  return {
    width: '100%' as const,
    minHeight: figmaTokens.size.input,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: figmaTokens.space.identityGap,
    paddingBottom: figmaTokens.space.x3,
  };
}

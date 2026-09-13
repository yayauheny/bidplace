import { figmaTokens } from '@bidplace/design-tokens';

export function filterSheetPanelStyle() {
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

import { figmaTokens } from '@bidplace/design-tokens';

export function filterSheetLayerStyle() {
  return {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end' as const,
    zIndex: figmaTokens.layer.modal,
  };
}

export function filterSheetPanelStyle() {
  return {
    width: '100%' as const,
    maxWidth: figmaTokens.size.phoneWidth,
    height: '100%' as const,
    alignSelf: 'center' as const,
    backgroundColor: figmaTokens.color.canvas,
    paddingTop: figmaTokens.space.pageGutter,
    paddingHorizontal: figmaTokens.space.pageGutter,
    paddingBottom: figmaTokens.space.x5,
    gap: figmaTokens.space.pageGutter,
  };
}

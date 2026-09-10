import { figmaTokens } from '@bidplace/design-tokens';

export function shareSheetLayerStyle() {
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

export function shareSheetPanelStyle() {
  return {
    width: '100%' as const,
    maxWidth: figmaTokens.size.phoneWidth,
    alignSelf: 'center' as const,
    backgroundColor: figmaTokens.color.canvas,
    borderTopLeftRadius: figmaTokens.radius.sheet,
    borderTopRightRadius: figmaTokens.radius.sheet,
    paddingTop: figmaTokens.space.pageGutter,
    paddingHorizontal: figmaTokens.space.pageGutter,
    paddingBottom: figmaTokens.space.x5,
    gap: 14,
    alignItems: 'center' as const,
  };
}

export function shareSheetHeaderStyle() {
  return {
    width: '100%' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    minHeight: figmaTokens.size.control,
    gap: figmaTokens.space.x2,
  };
}

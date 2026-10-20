import {
  searchChromeTokens,
  type SemanticColorMap,
} from '@bidplace/design-tokens';

const { field, close, rowGap } = searchChromeTokens;

export function searchOverlayFieldRowStyle() {
  return {
    width: '100%' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: rowGap,
  };
}

export function searchOverlayFieldChromeStyle() {
  return {
    flex: 1,
    minWidth: 0,
    height: field.sampleHeight,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: field.gap,
    padding: field.padding,
  };
}

export function searchOverlayIconFrameStyle() {
  return {
    width: field.iconFrame,
    height: field.iconFrame,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
  };
}

export function searchOverlayFieldInputStyle(palette: SemanticColorMap) {
  return {
    flex: 1,
    minWidth: 0,
    height: field.typography.lineHeight,
    padding: 0,
    margin: 0,
    color: palette.inkStrong,
    backgroundColor: 'transparent' as const,
    fontFamily: field.typography.fontFamily,
    fontSize: field.typography.fontSize,
    lineHeight: field.typography.lineHeight,
    letterSpacing: field.typography.letterSpacing,
    fontWeight: field.typography.fontWeight,
  };
}

export function searchOverlayCloseStyle() {
  return {
    width: close.sampleWidth,
    height: close.sampleHeight,
    flexShrink: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

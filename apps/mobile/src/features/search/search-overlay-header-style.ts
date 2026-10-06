import { figmaTokens } from '@bidplace/design-tokens';

/** Stadium search control. It is not the form field, so it keeps its own size and type. */
const searchControlSize = 52;

export function searchOverlayFieldRowStyle() {
  return {
    width: '100%' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: figmaTokens.space.x3,
  };
}

export function searchOverlayFieldChromeStyle() {
  return {
    flex: 1,
    minWidth: 0,
    height: searchControlSize,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: figmaTokens.space.x2,
    padding: figmaTokens.space.x2,
    borderRadius: figmaTokens.radius.dock,
    backgroundColor: figmaTokens.color.canvas,
    borderWidth: 0.5,
    borderColor: figmaTokens.color.border,
  };
}

export function searchOverlayIconFrameStyle() {
  return {
    width: figmaTokens.size.control,
    height: figmaTokens.size.control,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
  };
}

export function searchOverlayFieldInputStyle() {
  return {
    flex: 1,
    minWidth: 0,
    height: figmaTokens.size.control,
    padding: 0,
    margin: 0,
    color: figmaTokens.color.ink,
    backgroundColor: 'transparent',
    ...figmaTokens.typography.field,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: -0.16,
  };
}

export function searchOverlayCloseStyle() {
  return {
    width: searchControlSize,
    height: searchControlSize,
    borderRadius: figmaTokens.radius.dock,
    backgroundColor: figmaTokens.color.canvas,
    borderWidth: 0.5,
    borderColor: figmaTokens.color.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
  };
}

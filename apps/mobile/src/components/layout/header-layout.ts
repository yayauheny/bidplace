import type { TextStyle, ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export const headerClusterWidth = 420;
export const discoveryMenuDesktopWidth = 142;
export const discoveryMenuDesktopRadius = 22;

export const headerSearchPaddingHorizontal = 18;
export const headerSearchInputFontFamily = 'Inter_500Medium';
export const headerSearchInputFontSize = 15;

const ambientHeaderBorderBottomColor = 'rgba(255, 255, 255, 0.56)';
const discoveryWebMatteBlur = 'blur(12px)';
const discoveryWebMatteBoxShadow = '0 1px 8px rgba(0, 0, 0, 0.03)';

export const webMatteHeaderStyle = {
  backdropFilter: discoveryWebMatteBlur,
  WebkitBackdropFilter: discoveryWebMatteBlur,
  boxShadow: discoveryWebMatteBoxShadow,
} as unknown as ViewStyle;

export function headerOuterStyle(ambient: boolean): ViewStyle {
  return {
    zIndex: designTokens.layer.chrome,
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: ambient
      ? ambientHeaderBorderBottomColor
      : designTokens.color.border,
    backgroundColor: ambient ? designTokens.color.glass : designTokens.color.surface,
  };
}

export function headerInnerLayoutStyle({
  desktop,
  searchInline,
}: {
  desktop: boolean;
  searchInline: boolean;
}): ViewStyle {
  return {
    width: '100%',
    maxWidth: designTokens.layout.headerMaxWidth,
    alignSelf: 'center',
    minHeight: desktop ? designTokens.size.header : designTokens.size.mobileHeader,
    flexDirection: 'row',
    alignItems: 'center',
    gap: desktop && searchInline
      ? designTokens.space.x7
      : desktop
        ? designTokens.space.x6
        : designTokens.space.x3,
    paddingHorizontal: desktop
      ? designTokens.space.x8
      : designTokens.layout.mobileGutter,
  };
}

export function desktopBrandRowStyle(): ViewStyle {
  return {
    width: headerClusterWidth,
    flexDirection: 'row',
    alignItems: 'center',
  };
}

export function desktopActionsRowStyle(): ViewStyle {
  return {
    width: headerClusterWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: designTokens.space.x3,
  };
}

export function headerNavLinkStyle({
  desktop,
  active,
}: {
  desktop: boolean;
  active: boolean;
}): ViewStyle {
  return {
    minHeight: desktop
      ? designTokens.size.touch
      : designTokens.size.control,
    justifyContent: 'center',
    borderBottomWidth: desktop && active ? 2 : 0,
    borderBottomColor: designTokens.color.ink,
    borderRadius: desktop ? 0 : designTokens.radius.pill,
    paddingHorizontal: desktop
      ? designTokens.space.x3
      : designTokens.space.x4,
  };
}

export function headerNavLinkInteractionStyle({
  active,
}: {
  desktop: boolean;
  active: boolean;
}): ({ hovered, pressed }: { hovered: boolean; pressed: boolean }) => ViewStyle {
  return ({ hovered, pressed }) => ({
    backgroundColor: active
      ? designTokens.color.surfaceStrong
      : hovered || pressed
        ? designTokens.color.surfaceMuted
        : 'transparent',
  });
}

export function discoveryTriggerStyle({
  desktop,
}: {
  desktop: boolean;
  active?: boolean;
}): ViewStyle {
  return {
    minHeight: desktop
      ? designTokens.size.touch
      : designTokens.size.control,
    width: desktop ? discoveryMenuDesktopWidth : undefined,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.space.x1,
    borderRadius: desktop ? discoveryMenuDesktopRadius : designTokens.radius.pill,
    backgroundColor: desktop
      ? designTokens.color.surfaceStrong
      : 'transparent',
    paddingHorizontal: desktop ? designTokens.space.x3 : designTokens.space.x4,
  };
}

export function discoveryTriggerInteractionStyle({
  active,
}: {
  desktop: boolean;
  active: boolean;
}): ({ hovered, pressed }: { hovered: boolean; pressed: boolean }) => ViewStyle {
  return ({ hovered, pressed }) => ({
    backgroundColor: active
      ? designTokens.color.surfaceStrong
      : hovered || pressed
        ? designTokens.color.surfaceMuted
        : 'transparent',
  });
}

export function headerSearchContainerStyle({
  inline,
}: {
  inline: boolean;
}): ViewStyle {
  return {
    width: inline ? '100%' : undefined,
    maxWidth: inline ? 480 : undefined,
    flex: inline ? 1 : undefined,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.space.x3,
    minHeight: designTokens.size.input,
    borderRadius: designTokens.radius.pill,
    borderWidth: 1,
    borderColor: designTokens.color.border,
    backgroundColor: designTokens.color.searchSurface,
    paddingHorizontal: headerSearchPaddingHorizontal,
  };
}

export function headerSearchInputStyle(): TextStyle {
  return {
    flex: 1,
    minWidth: 0,
    color: designTokens.color.ink,
    fontFamily: headerSearchInputFontFamily,
    fontSize: headerSearchInputFontSize,
  };
}

export function createListingActionStyle(): ViewStyle {
  return {
    minHeight: designTokens.size.buttonCompact,
    justifyContent: 'center',
    borderRadius: designTokens.radius.pill,
    backgroundColor: designTokens.color.action,
    paddingHorizontal: designTokens.space.x5,
  };
}

export function createListingActionInteractionStyle(): ({
  hovered,
  pressed,
}: {
  hovered: boolean;
  pressed: boolean;
}) => ViewStyle {
  return ({ hovered, pressed }) => ({
    backgroundColor:
      hovered || pressed ? designTokens.color.actionHover : designTokens.color.action,
  });
}


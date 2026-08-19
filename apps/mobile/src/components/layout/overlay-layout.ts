import type { ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export function overlayPanelStyle({
  width,
  minWidth,
  position,
  top,
  right,
  left,
  borderRadius,
  borderColor,
  gap,
  padding,
}: {
  width?: number;
  minWidth?: number;
  position?: ViewStyle['position'];
  top?: number;
  right?: number;
  left?: number;
  borderRadius: number;
  borderColor: string;
  gap: number;
  padding: number;
}): ViewStyle {
  return {
    position,
    top,
    right,
    left,
    width,
    minWidth,
    gap,
    borderWidth: 1,
    borderColor,
    borderRadius,
    backgroundColor: designTokens.color.surface,
    padding,
    ...designTokens.elevation.floating,
  };
}

export function overlayMenuItemStyle({
  minHeight,
  width,
  borderRadius,
  paddingHorizontal,
  gap,
}: {
  minHeight: number;
  width?: ViewStyle['width'];
  borderRadius: number;
  paddingHorizontal: number;
  gap: number;
}): ViewStyle {
  return {
    minHeight,
    width,
    flexDirection: 'row',
    alignItems: 'center',
    gap,
    borderRadius,
    paddingHorizontal,
  };
}


import type { CSSProperties } from 'react';
import type { FlexStyle, ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export function sheetWidthConstraint(
  viewportWidth: number,
): number | '100%' {
  return viewportWidth <= designTokens.layout.sheetFillViewportMax
    ? '100%'
    : designTokens.layout.sheetMax;
}

export function appDialogHostStyle({
  presentation,
  viewportGutter,
  viewportWidth,
}: {
  presentation: 'dialog' | 'sheet' | 'mediaSheet';
  viewportGutter: number;
  viewportWidth: number;
}): ViewStyle {
  const isSheet = presentation !== 'dialog';

  return {
    inset: 0,
    flexDirection: 'column',
    alignItems: isSheet ? 'stretch' : 'center',
    ...(isSheet
      ? {
          width: '100%',
          maxWidth: sheetWidthConstraint(viewportWidth),
          marginLeft: 'auto',
          marginRight: 'auto',
        }
      : {}),
    justifyContent: isSheet ? 'flex-end' : 'center',
    paddingHorizontal: isSheet ? 0 : viewportGutter,
    zIndex: designTokens.layer.modal,
    pointerEvents: 'box-none',
  };
}

export function appDialogSheetBottomSpace(space: number, inset: number) {
  return Math.max(space, inset);
}

export function appDialogHostFlexDirection(
  value:
    | FlexStyle['flexDirection']
    | CSSProperties['flexDirection']
    | undefined,
): NonNullable<CSSProperties['flexDirection']> {
  return value ?? 'column';
}

import type { CSSProperties } from 'react';
import type { FlexStyle, ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export function appDialogHostStyle({
  presentation,
  viewportGutter,
}: {
  presentation: 'dialog' | 'sheet' | 'mediaSheet';
  viewportGutter: number;
}): ViewStyle {
  const isSheet = presentation !== 'dialog';

  return {
    inset: 0,
    flexDirection: 'column',
    alignItems: isSheet ? 'stretch' : 'center',
    ...(isSheet
      ? {
          width: '100%',
          maxWidth: designTokens.layout.sheetMax,
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

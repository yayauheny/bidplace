import type { CSSProperties } from 'react';
import type { FlexStyle, ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export function appDialogHostStyle({
  presentation,
  width,
  viewportGutter,
}: {
  presentation: 'dialog' | 'sheet';
  width: number;
  viewportGutter: number;
}): ViewStyle {
  const isSheet = presentation === 'sheet';

  return {
    inset: 0,
    flexDirection: 'column',
    alignItems: isSheet ? 'stretch' : 'center',
    ...(isSheet
      ? {
          left: Math.max((width - designTokens.layout.phoneWidth) / 2, 0),
          right: Math.max((width - designTokens.layout.phoneWidth) / 2, 0),
        }
      : {}),
    justifyContent: isSheet ? 'flex-end' : 'center',
    paddingHorizontal: isSheet ? 0 : viewportGutter,
    zIndex: designTokens.layer.modal,
    pointerEvents: 'box-none',
  };
}

export function appDialogHostFlexDirection(
  value: FlexStyle['flexDirection'] | CSSProperties['flexDirection'] | undefined,
): NonNullable<CSSProperties['flexDirection']> {
  return value ?? 'column';
}

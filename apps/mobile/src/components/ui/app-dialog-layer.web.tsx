import type { CSSProperties, ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import * as Dialog from '@rn-primitives/dialog';

import { appDialogHostFlexDirection } from './app-dialog-host-style';

function toFixedCss(style: StyleProp<ViewStyle>): CSSProperties {
  const flat = StyleSheet.flatten(style) ?? {};
  const {
    paddingHorizontal,
    pointerEvents: _pointerEvents,
    alignItems,
    justifyContent,
    flexDirection,
    ...rest
  } = flat as ViewStyle & {
    paddingHorizontal?: number;
    pointerEvents?: string;
  };
  void _pointerEvents;
  const css: CSSProperties = {
    position: 'fixed',
    ...(rest as CSSProperties),
  };
  if (paddingHorizontal != null) {
    css.paddingLeft = paddingHorizontal;
    css.paddingRight = paddingHorizontal;
  }
  if (alignItems) {
    css.alignItems = alignItems;
  }
  if (justifyContent) {
    css.justifyContent = justifyContent;
  }
  css.flexDirection = appDialogHostFlexDirection(flexDirection);
  return css;
}

export function AppDialogOverlay({ style }: { style: StyleProp<ViewStyle> }) {
  return (
    <div style={toFixedCss(style)}>
      <Dialog.Overlay
        closeOnPress
        style={{ position: 'absolute', inset: 0 }}
      />
    </div>
  );
}

export function AppDialogFrame({
  style,
  children,
}: {
  style: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const css = toFixedCss(style);
  css.display = 'flex';
  css.flexDirection = appDialogHostFlexDirection(css.flexDirection);
  css.pointerEvents = 'none';
  return (
    <div id="app-dialog-host" style={css}>
      <div style={{ pointerEvents: 'auto', width: '100%' }}>{children}</div>
    </div>
  );
}

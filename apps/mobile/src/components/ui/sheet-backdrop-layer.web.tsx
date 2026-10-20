import { createPortal } from 'react-dom';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { designTokens } from '@bidplace/design-tokens';
import {
  sheetBackdropEnter,
  sheetBackdropExit,
} from '../../lib/layout-transition';

export function SheetBackdropLayer({
  open,
  color,
}: {
  open: boolean;
  color: string;
}) {
  if (typeof document === 'undefined') return null;
  // Mount before dialog portals so the dimmer stays below their controls.
  return createPortal(
    <div
      id="sheet-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: designTokens.layer.modal,
      }}
    >
      {open ? (
        <Animated.View
          pointerEvents="none"
          entering={sheetBackdropEnter}
          exiting={sheetBackdropExit}
          style={[StyleSheet.absoluteFill, { backgroundColor: color }]}
        />
      ) : null}
    </div>,
    document.body,
  );
}

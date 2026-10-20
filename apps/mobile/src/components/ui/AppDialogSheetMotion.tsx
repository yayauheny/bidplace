import type { ReactNode } from 'react';
import Animated from 'react-native-reanimated';
import { sheetExit, type sheetEnter } from '../../lib/layout-transition';

export type AppDialogSheetMotionProps = {
  open: boolean;
  entering: ReturnType<typeof sheetEnter>;
  onEntered: () => void;
  children: ReactNode;
};

export function AppDialogSheetMotion({
  open,
  entering,
  children,
}: AppDialogSheetMotionProps) {
  return open ? (
    <Animated.View
      entering={entering}
      exiting={sheetExit}
      style={{ width: '100%' }}
    >
      {children}
    </Animated.View>
  ) : null;
}

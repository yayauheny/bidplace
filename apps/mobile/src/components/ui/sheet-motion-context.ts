import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

export const SheetMotionContext = createContext<{
  position: SharedValue<number>;
  cancelDrag: () => void;
  dismissDrag: (requestClose: () => void) => void;
} | null>(null);

export function useSheetMotion() {
  const motion = useContext(SheetMotionContext);
  if (!motion)
    throw new Error('SheetDragSurface requires AppDialogSheetMotion');
  return motion;
}

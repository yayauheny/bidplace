import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  PanResponder,
  View,
  type GestureResponderHandlers,
} from 'react-native';
import { cancelAnimation } from 'react-native-reanimated';
import { useSheetMotion } from './sheet-motion-context';
import { shouldDismissSheet } from './sheet-dismissal';

const DragContext = createContext<GestureResponderHandlers>({});

export function SheetDragSurface({
  children,
  enabled,
  onRequestClose,
}: {
  children: ReactNode;
  enabled: boolean;
  onRequestClose: () => void;
}) {
  const { position, cancelDrag, dismissDrag } = useSheetMotion();
  const close = useRef(onRequestClose);
  close.current = onRequestClose;
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          enabled && gesture.dy > 6 && gesture.dy > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          cancelAnimation(position);
          position.value = Math.max(0, gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          if (shouldDismissSheet(gesture.dx, gesture.dy, gesture.vy))
            dismissDrag(() => close.current());
          else cancelDrag();
        },
        onPanResponderTerminate: cancelDrag,
      }),
    [enabled, position, cancelDrag, dismissDrag],
  );
  return (
    <DragContext.Provider value={enabled ? responder.panHandlers : {}}>
      <View style={{ width: '100%' }}>{children}</View>
    </DragContext.Provider>
  );
}

export function SheetDragHandle({ children }: { children: ReactNode }) {
  const handlers = useContext(DragContext);
  return (
    <View {...handlers} style={{ width: '100%', minWidth: 0 }}>
      {children}
    </View>
  );
}

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  Animated,
  PanResponder,
  View,
  type GestureResponderHandlers,
} from 'react-native';
import { useReducedMotion } from '../../lib/reduced-motion';
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
  const reducedMotion = useReducedMotion();
  const offset = useRef(new Animated.Value(0)).current;
  const close = useRef(onRequestClose);
  close.current = onRequestClose;
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          enabled && gesture.dy > 6 && gesture.dy > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) =>
          offset.setValue(Math.max(0, gesture.dy)),
        onPanResponderRelease: (_, gesture) => {
          if (reducedMotion) offset.setValue(0);
          else
            Animated.spring(offset, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          if (shouldDismissSheet(gesture.dx, gesture.dy, gesture.vy))
            close.current();
        },
        onPanResponderTerminate: () => {
          if (reducedMotion) offset.setValue(0);
          else
            Animated.spring(offset, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
        },
      }),
    [enabled, offset, reducedMotion],
  );
  return (
    <DragContext.Provider value={enabled ? responder.panHandlers : {}}>
      <Animated.View
        style={{ width: '100%', transform: [{ translateY: offset }] }}
      >
        {children}
      </Animated.View>
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

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { sheetTimingConfig } from '../../lib/layout-transition';
import { SheetMotionContext } from './sheet-motion-context';

/** One live tree and one translation for enter, drag, cancellation and exit. */
export function AppDialogSheetMotion({
  open,
  onEntered,
  onExited,
  children,
}: {
  open: boolean;
  onEntered: () => void;
  onExited?: () => void;
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const [present, setPresent] = useState(open);
  const [ready, setReady] = useState(false);
  const openRef = useRef(open);
  const heightRef = useRef(height);
  const presentRef = useRef(present);
  const exitRef = useRef(onExited);
  const releaseFrame = useRef<number | null>(null);
  openRef.current = open;
  heightRef.current = height;
  presentRef.current = present;
  exitRef.current = onExited;
  const position = useSharedValue(height);
  const finishExit = useCallback(() => {
    if (openRef.current) return;
    setPresent(false);
    exitRef.current?.();
  }, []);
  const finishEnter = useCallback(() => {
    if (openRef.current) setReady(true);
  }, []);
  useEffect(() => {
    if (open && ready) onEntered();
  }, [open, ready, onEntered]);
  useEffect(() => {
    setReady(false);
    if (open) {
      if (!presentRef.current) position.value = heightRef.current;
      setPresent(true);
    }
    position.value = withTiming(
      open ? 0 : Math.max(heightRef.current, position.value),
      sheetTimingConfig,
      (finished) => {
        if (!finished) return;
        if (open) scheduleOnRN(finishEnter);
        else scheduleOnRN(finishExit);
      },
    );
    return () => cancelAnimation(position);
  }, [open, position, finishEnter, finishExit]);
  useEffect(
    () => () => {
      if (releaseFrame.current !== null)
        cancelAnimationFrame(releaseFrame.current);
    },
    [],
  );
  const cancelDrag = useCallback(() => {
    if (openRef.current) position.value = withTiming(0, sheetTimingConfig);
  }, [position]);
  const dismissDrag = useCallback(
    (requestClose: () => void) => {
      // Keep the drag position. Accepted dismissal animates from here; a guard
      // which keeps the sheet open returns it to its resting position.
      requestClose();
      releaseFrame.current = requestAnimationFrame(() => {
        releaseFrame.current = null;
        cancelDrag();
      });
    },
    [cancelDrag],
  );
  const motion = useMemo(
    () => ({ position, cancelDrag, dismissDrag }),
    [position, cancelDrag, dismissDrag],
  );
  const style = useAnimatedStyle(() => ({
    transform: position.value === 0 ? [] : [{ translateY: position.value }],
  }));
  return open || present ? (
    <SheetMotionContext.Provider value={motion}>
      <Animated.View
        {...(Platform.OS === 'web'
          ? {
              inert: !open || !ready,
              'aria-hidden': !open || !ready,
              dataSet: { sheetMotion: 'true' },
            }
          : {})}
        pointerEvents={open && ready ? 'auto' : 'none'}
        style={[{ width: '100%' }, style]}
      >
        {children}
      </Animated.View>
    </SheetMotionContext.Provider>
  ) : null;
}

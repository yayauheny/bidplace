import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { sheetTimingConfig } from '../../lib/layout-transition';
import type { AppDialogSheetMotionProps } from './AppDialogSheetMotion';

/** Keep one DOM tree: Reanimated layout exiting moves live controls into a dummy clone on web. */
export function AppDialogSheetMotion({
  open,
  onEntered,
  children,
}: AppDialogSheetMotionProps) {
  const { height } = useWindowDimensions();
  const [present, setPresent] = useState(open);
  const [ready, setReady] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;
  const progress = useSharedValue(0);
  const finishExit = useCallback(() => {
    if (!openRef.current) setPresent(false);
  }, []);
  const finishEnter = useCallback(() => {
    if (openRef.current) setReady(true);
  }, []);
  useEffect(() => {
    if (open && ready) onEntered();
  }, [open, ready, onEntered]);
  useEffect(() => {
    setReady(false);
    if (open) setPresent(true);
    progress.value = withTiming(open ? 1 : 0, sheetTimingConfig, (finished) => {
      if (!finished) return;
      if (open) scheduleOnRN(finishEnter);
      else scheduleOnRN(finishExit);
    });
    return () => cancelAnimation(progress);
  }, [open, progress, finishEnter, finishExit]);
  const style = useAnimatedStyle(() => ({
    transform:
      progress.value === 1
        ? []
        : [{ translateY: (1 - progress.value) * height }],
  }));
  return open || present ? (
    <div
      inert={!open || !ready}
      aria-hidden={!open || !ready}
      style={{ width: '100%', pointerEvents: open && ready ? 'auto' : 'none' }}
    >
      <Animated.View style={[{ width: '100%' }, style]}>
        {children}
      </Animated.View>
    </div>
  ) : null;
}

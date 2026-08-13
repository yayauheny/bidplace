import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import {
  getSlideToBidGeometry,
  shouldCompleteSlideToBid,
  slideToBidTrackHeight,
  slideToBidTrackPadding,
} from './slide-to-bid-geometry';

type SlideToBidProps = {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  resetKey?: string | number;
  onComplete: () => void;
};

export function SlideToBid({
  label,
  disabled = false,
  loading = false,
  resetKey,
  onComplete,
}: SlideToBidProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const offset = useRef(new Animated.Value(0)).current;
  const currentOffset = useRef(0);
  const startOffset = useRef(0);
  const completed = useRef(false);
  const geometry = useMemo(
    () => getSlideToBidGeometry(trackWidth),
    [trackWidth],
  );
  const isDisabled = disabled || loading || trackWidth === 0;

  const reset = useCallback(
    (toValue = 0) => {
      currentOffset.current = toValue;
      completed.current = false;
      offset.stopAnimation();
      Animated.spring(offset, {
        toValue,
        useNativeDriver: Platform.OS !== 'web',
        speed: 28,
        bounciness: 0,
      }).start();
    },
    [offset],
  );

  useEffect(() => {
    reset(loading ? geometry.maxOffset : 0);
  }, [disabled, geometry.maxOffset, loading, reset, resetKey]);

  const complete = useCallback(() => {
    if (isDisabled || completed.current) return;
    completed.current = true;
    reset(geometry.maxOffset);
    onComplete();
  }, [geometry.maxOffset, isDisabled, onComplete, reset]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isDisabled,
        onMoveShouldSetPanResponder: (_event, gesture) => {
          if (isDisabled) return false;
          return (
            Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
            Math.abs(gesture.dx) > 4
          );
        },
        onPanResponderGrant: () => {
          startOffset.current = currentOffset.current;
        },
        onPanResponderMove: (_event, gesture) => {
          const next = Math.min(
            geometry.maxOffset,
            Math.max(0, startOffset.current + gesture.dx),
          );
          currentOffset.current = next;
          offset.setValue(next);
        },
        onPanResponderRelease: () => {
          offset.stopAnimation((value) => {
            currentOffset.current = value;
            if (shouldCompleteSlideToBid(value, geometry.maxOffset)) {
              complete();
            } else {
              reset();
            }
          });
        },
        onPanResponderTerminate: () => reset(),
        onPanResponderTerminationRequest: () => false,
      }),
    [complete, geometry.maxOffset, isDisabled, offset, reset],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      testID="slide-to-bid"
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityActions={[
        { name: 'increment', label: 'Подтвердить ставку' },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') complete();
      }}
      onLayout={handleLayout}
      style={{
        width: '100%',
        height: slideToBidTrackHeight,
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: slideToBidTrackHeight / 2,
        borderWidth: 1,
        borderColor: '#14141417',
        backgroundColor: designTokens.color.surfaceStrong,
        padding: slideToBidTrackPadding,
      }}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={{
          width: geometry.controlWidth,
          height: slideToBidTrackHeight - slideToBidTrackPadding * 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: designTokens.radius.button,
          backgroundColor: isDisabled
            ? designTokens.color.placeholder
            : designTokens.color.action,
          transform: [{ translateX: offset }],
        }}
      >
        <AppText
          role="button"
          numberOfLines={1}
          style={{
            color: isDisabled
              ? designTokens.color.textMuted
              : designTokens.color.surface,
            fontFamily: 'Onest_600SemiBold',
          }}
        >
          {loading ? 'Отправляем ставку…' : label}
        </AppText>
        {!loading ? (
          <View
            style={{
              position: 'absolute',
              right: designTokens.space.x4,
              flexDirection: 'row',
            }}
          >
            <AppIcon
              name="chevronRight"
              size={16}
              color={designTokens.color.surface}
            />
            <AppIcon name="chevronRight" size={16} color="#FFFFFFB8" />
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

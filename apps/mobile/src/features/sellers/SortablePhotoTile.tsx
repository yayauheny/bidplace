import { useState } from 'react';
import { sheetTimingConfig } from '../../lib/layout-transition';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  photoDropIndex,
  photoPreviewIndex,
  type SortablePhotoTileProps,
} from './sortable-photo-tile';
export function SortablePhotoTile({
  id,
  index,
  count,
  columns,
  disabled,
  onMove,
  preview,
  onPreview,
  children,
}: SortablePhotoTileProps) {
  const [width, setWidth] = useState(177);
  const x = useSharedValue(0),
    y = useSharedValue(0),
    active = useSharedValue(false);
  const position = photoPreviewIndex(index, preview);
  const shiftX = ((position % columns) - (index % columns)) * (width + 12);
  const shiftY =
    (Math.floor(position / columns) - Math.floor(index / columns)) *
    ((width * 4) / 3 + 12);
  const reportPreview = (x: number, y: number) =>
    onPreview?.({
      id,
      from: index,
      to: photoDropIndex(index, count, columns, width, x, y),
    });
  const clearPreview = () => onPreview?.(null);
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: active.value
          ? x.value
          : withTiming(shiftX, sheetTimingConfig),
      },
      {
        translateY: active.value
          ? y.value
          : withTiming(shiftY, sheetTimingConfig),
      },
    ],
    zIndex: active.value ? 1 : 0,
  }));
  const gesture = Gesture.Pan()
    .enabled(!disabled)
    .activateAfterLongPress(250)
    .onStart(() => {
      active.value = true;
      runOnJS(reportPreview)(0, 0);
    })
    .onUpdate((event) => {
      x.value = event.translationX;
      y.value = event.translationY;
      runOnJS(reportPreview)(event.translationX, event.translationY);
    })
    .onEnd((event) => {
      runOnJS(onMove)(
        id,
        photoDropIndex(
          index,
          count,
          columns,
          width,
          event.translationX,
          event.translationY,
        ),
      );
    })
    .onFinalize(() => {
      x.value = 0;
      y.value = 0;
      active.value = false;
      runOnJS(clearPreview)();
    });
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
        style={[{ width: '100%' }, style]}
        accessible
        accessibilityLabel={`Фото ${index + 1} из ${count}`}
        accessibilityActions={[
          { name: 'increment', label: 'Переместить позже' },
          { name: 'decrement', label: 'Переместить раньше' },
        ]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (!disabled)
            onMove(
              id,
              Math.max(
                0,
                Math.min(
                  count - 1,
                  index + (nativeEvent.actionName === 'increment' ? 1 : -1),
                ),
              ),
            );
        }}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

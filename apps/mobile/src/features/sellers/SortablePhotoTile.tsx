import { useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  photoDropIndex,
  type SortablePhotoTileProps,
} from './sortable-photo-tile';
export function SortablePhotoTile({
  id,
  index,
  count,
  columns,
  disabled,
  onMove,
  children,
}: SortablePhotoTileProps) {
  const [width, setWidth] = useState(177);
  const x = useSharedValue(0),
    y = useSharedValue(0),
    active = useSharedValue(false);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    zIndex: active.value ? 1 : 0,
  }));
  const gesture = Gesture.Pan()
    .enabled(!disabled)
    .activateAfterLongPress(250)
    .onStart(() => {
      active.value = true;
    })
    .onUpdate((event) => {
      x.value = event.translationX;
      y.value = event.translationY;
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

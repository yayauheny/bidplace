import { useState } from 'react';
import { Platform, type LayoutChangeEvent } from 'react-native';

/** RN Web rounds `onLayout`. Resolved CSS width/height keep the border-box fraction. */
export function useCssBorderBox() {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const target = 'target' in event.nativeEvent ? event.nativeEvent.target : undefined;
    const style =
      Platform.OS === 'web' && target instanceof HTMLElement
        ? getComputedStyle(target)
        : null;
    const measured = style
      ? { width: Number.parseFloat(style.width), height: Number.parseFloat(style.height) }
      : event.nativeEvent.layout;
    const { width, height } = measured;
    setLayout((previous) =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height },
    );
  };
  return { layout, onLayout };
}

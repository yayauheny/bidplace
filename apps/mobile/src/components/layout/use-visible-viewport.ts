import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

export function useVisibleViewport() {
  const window = useWindowDimensions();
  const [visible, setVisible] = useState<{
    height: number;
    top: number;
    layoutHeight: number;
  } | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const viewport = globalThis.window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const layoutHeight = document.documentElement.clientHeight;
      // RN Web dimensions already normalize pinch; keyboard resizing must still update.
      const height = Math.min(
        layoutHeight,
        Math.round(viewport.height * viewport.scale),
      );
      setVisible((previous) => ({
        height,
        layoutHeight,
        top:
          height >= layoutHeight
            ? 0
            : viewport.scale === 1
              ? viewport.offsetTop
              : (previous?.top ?? 0),
      }));
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    globalThis.window.addEventListener('resize', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      globalThis.window.removeEventListener('resize', update);
    };
  }, []);
  return {
    ...window,
    layoutHeight: visible?.layoutHeight ?? window.height,
    height: Math.min(window.height, visible?.height ?? window.height),
    offsetTop: visible?.top ?? 0,
  };
}

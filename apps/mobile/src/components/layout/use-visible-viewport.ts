import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

export function useVisibleViewport() {
  const window = useWindowDimensions();
  const [visible, setVisible] = useState<{
    height: number;
    top: number;
  } | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const viewport = globalThis.window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setVisible({ height: viewport.height, top: viewport.offsetTop });
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);
  return {
    ...window,
    height: Math.min(window.height, visible?.height ?? window.height),
    offsetTop: visible?.top ?? 0,
  };
}

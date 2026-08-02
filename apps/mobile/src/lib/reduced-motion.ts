import { AccessibilityInfo, Platform } from 'react-native';
import { useEffect, useState } from 'react';

export { getMotionDuration } from './motion';

export function getInitialReducedMotion(): boolean {
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return undefined;
      }
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }

    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export function useShareAction(enabled = true) {
  const [status, setStatus] = useState<'idle' | 'confirmed' | 'error'>('idle');
  const mounted = useRef(enabled);
  const version = useRef(0);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useLayoutEffect(() => {
    mounted.current = enabled;
    if (!enabled) setStatus('idle');
    return () => {
      mounted.current = false;
      version.current += 1;
      clearTimeout(timer.current);
    };
  }, [enabled]);
  const run = useCallback(async (operation: () => Promise<void>) => {
    if (busy.current || !mounted.current) return;
    busy.current = true;
    const currentVersion = version.current;
    clearTimeout(timer.current);
    try {
      await operation();
      if (!mounted.current || currentVersion !== version.current) return;
      setStatus('confirmed');
      timer.current = setTimeout(() => setStatus('idle'), 1800);
    } catch {
      if (mounted.current && currentVersion === version.current)
        setStatus('error');
    } finally {
      busy.current = false;
    }
  }, []);
  return { status, run };
}

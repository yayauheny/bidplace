import { createPortal } from 'react-dom';
import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

type Anchor = { getBoundingClientRect: () => DOMRect };
type OverlayContextValue = { target: HTMLElement | null };

const OverlayContext = createContext<OverlayContextValue>({ target: null });

export function OverlayHost({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setTarget(document.getElementById('app-overlay-host'));
    }
  }, []);

  return (
    <OverlayContext.Provider value={{ target }}>
      <View style={{ flex: 1, position: 'relative' }}>{children}</View>
      <View
        nativeID="app-overlay-host"
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: modernTokens.layer.popover,
        }}
      />
    </OverlayContext.Provider>
  );
}

export function OverlayPortal({
  anchorRef,
  children,
  placement = 'bottom-end',
  testId,
}: {
  anchorRef: { current: Anchor | null };
  children: ReactNode;
  placement?: 'bottom-end' | 'right-start';
  testId?: string;
}) {
  const { target } = useContext(OverlayContext);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || !target || !anchorRef.current) return;

    const update = () => setRect(anchorRef.current?.getBoundingClientRect() ?? null);
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, target]);

  if (Platform.OS !== 'web') return <>{children}</>;
  if (!target) return null;

  const style =
    placement === 'right-start'
      ? { left: rect ? rect.right + modernTokens.space.x2 : 0, top: rect?.top ?? 0 }
      : { left: rect ? rect.right - 180 : 0, top: rect ? rect.bottom + modernTokens.space.x2 : 0 };

  return createPortal(
    <View
      nativeID={testId}
      pointerEvents="auto"
      style={{ position: 'fixed', ...style, zIndex: modernTokens.layer.popover }}
    >
      {children}
    </View>,
    target,
  );
}

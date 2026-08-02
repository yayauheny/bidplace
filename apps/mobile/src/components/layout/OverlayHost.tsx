import { createPortal } from 'react-dom';
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';
import { Platform, View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { getBottomEndPosition } from './overlay-geometry';

type Anchor = { getBoundingClientRect: () => DOMRect };
type OverlayContextValue = { target: HTMLElement | null };
const defaultPopoverWidth = 180;

const OverlayContext = createContext<OverlayContextValue>({ target: null });

export function OverlayHost({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const setOverlayTarget = useCallback((node: View | null) => {
    if (Platform.OS !== 'web') return;
    setTarget(node as unknown as HTMLElement | null);
  }, []);

  return (
    <OverlayContext.Provider value={{ target }}>
      <View style={{ flex: 1, position: 'relative' }}>{children}</View>
      <View
        nativeID="app-overlay-host"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: modernTokens.layer.popover,
          pointerEvents: 'none',
        }}
      >
        <View
          ref={setOverlayTarget}
          style={{ width: 0, height: 0, pointerEvents: 'auto' }}
        />
      </View>
    </OverlayContext.Provider>
  );
}

export function OverlayPortal({
  anchorRef,
  children,
  placement = 'bottom-end',
  collisionInset = modernTokens.space.x2,
  width = defaultPopoverWidth,
  testId,
}: {
  anchorRef: { current: Anchor | null };
  children: ReactNode;
  placement?: 'bottom-end' | 'right-start';
  collisionInset?: number;
  width?: number;
  testId?: string;
}) {
  const { target } = useContext(OverlayContext);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || !target || !anchorRef.current) return;

    const update = () =>
      setRect(anchorRef.current?.getBoundingClientRect() ?? null);
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, target]);

  if (Platform.OS !== 'web') return <>{children}</>;
  const anchorRect = rect ?? anchorRef.current?.getBoundingClientRect() ?? null;
  if (!target || !anchorRect) return null;

  const style = (() => {
    if (placement === 'right-start') {
      return {
        left: anchorRect.right + modernTokens.space.x2,
        top: anchorRect.top,
      };
    }

    return getBottomEndPosition({
      anchorRight: anchorRect.right,
      anchorBottom: anchorRect.bottom,
      viewportWidth: window.innerWidth,
      width,
      collisionInset,
      gap: modernTokens.space.x2,
    });
  })();

  return createPortal(
    <View
      nativeID={testId}
      style={{
        position: 'fixed',
        ...style,
        width: placement === 'bottom-end' ? width : undefined,
        zIndex: modernTokens.layer.popover,
        pointerEvents: 'auto',
      }}
    >
      {children}
    </View>,
    target,
  );
}

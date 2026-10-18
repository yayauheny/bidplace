import { designTokens } from '@bidplace/design-tokens';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent,
} from 'react';
import { useReducedMotion } from '../../lib/reduced-motion';
import { shouldDismissSheet } from './sheet-dismissal';

const DragContext = createContext<
  ((event: PointerEvent<HTMLDivElement>) => void) | null
>(null);

export function SheetDragSurface({
  children,
  enabled,
  onRequestClose,
}: {
  children: ReactNode;
  enabled: boolean;
  onRequestClose: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const pendingDismiss = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (pendingDismiss.current !== null)
        cancelAnimationFrame(pendingDismiss.current);
    },
    [],
  );
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    x: number;
    y: number;
    time: number;
    id: number;
  } | null>(null);
  const reset = () => {
    drag.current = null;
    setDragging(false);
    setOffset(0);
  };
  return (
    <DragContext.Provider
      value={
        enabled
          ? (event) => {
              if (!event.isPrimary || event.button !== 0) return;
              drag.current = {
                x: event.clientX,
                y: event.clientY,
                time: event.timeStamp,
                id: event.pointerId,
              };
            }
          : null
      }
    >
      <div
        style={{
          width: '100%',
          minWidth: 0,
          transform: offset ? `translateY(${offset}px)` : undefined,
          transition:
            dragging || reducedMotion
              ? 'none'
              : `transform ${designTokens.motion.control}ms ${designTokens.motion.easing}`,
        }}
        onPointerMove={(event) => {
          if (!enabled) return reset();
          const start = drag.current;
          if (!start || start.id !== event.pointerId) return;
          const dy = event.clientY - start.y;
          if (dy <= 6 || dy <= Math.abs(event.clientX - start.x)) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.preventDefault();
          setDragging(true);
          setOffset(dy);
        }}
        onPointerUp={(event) => {
          if (!enabled) return reset();
          const start = drag.current;
          if (!start || start.id !== event.pointerId) return;
          const dy = event.clientY - start.y;
          const dismiss = shouldDismissSheet(
            event.clientX - start.x,
            dy,
            dy / Math.max(event.timeStamp - start.time, 1),
          );
          reset();
          if (dismiss) {
            event.preventDefault();
            // Finish pointer release before removing the focus scope (Safari).
            pendingDismiss.current = requestAnimationFrame(() => {
              pendingDismiss.current = null;
              onRequestClose();
            });
          }
        }}
        onPointerCancel={reset}
        onLostPointerCapture={(event) => {
          if (event.target === event.currentTarget) reset();
        }}
      >
        {children}
      </div>
    </DragContext.Provider>
  );
}

export function SheetDragHandle({ children }: { children: ReactNode }) {
  const start = useContext(DragContext);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minWidth: 0,
        touchAction: start ? 'none' : undefined,
        userSelect: start ? 'none' : undefined,
      }}
      data-sheet-drag-handle="true"
      onPointerDown={start ?? undefined}
    >
      {children}
    </div>
  );
}

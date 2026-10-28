import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
  type PointerEvent,
} from 'react';
import { cancelAnimation } from 'react-native-reanimated';
import { useSheetMotion } from './sheet-motion-context';
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
  const { position, cancelDrag, dismissDrag } = useSheetMotion();
  const drag = useRef<{
    x: number;
    y: number;
    time: number;
    id: number;
    captured: boolean;
  } | null>(null);
  const reset = () => {
    drag.current = null;
    cancelDrag();
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
                captured: false,
              };
            }
          : null
      }
    >
      <div
        style={{
          width: '100%',
          minWidth: 0,
        }}
        onPointerMove={(event) => {
          if (!enabled) {
            if (drag.current) reset();
            return;
          }
          const start = drag.current;
          if (!start || start.id !== event.pointerId) return;
          const dy = event.clientY - start.y;
          if (!start.captured) {
            if (dy <= 6 || dy <= Math.abs(event.clientX - start.x)) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            start.captured = true;
          }
          event.preventDefault();
          cancelAnimation(position);
          position.value = Math.max(0, dy);
        }}
        onPointerUp={(event) => {
          if (!enabled) {
            if (drag.current) reset();
            return;
          }
          const start = drag.current;
          if (!start || start.id !== event.pointerId) return;
          const dy = event.clientY - start.y;
          const dismiss = shouldDismissSheet(
            event.clientX - start.x,
            dy,
            dy / Math.max(event.timeStamp - start.time, 1),
          );
          drag.current = null;
          if (dismiss) {
            event.preventDefault();
            dismissDrag(onRequestClose);
          } else {
            cancelDrag();
          }
        }}
        onPointerCancel={() => {
          if (drag.current) reset();
        }}
        onLostPointerCapture={(event) => {
          if (drag.current && event.target === event.currentTarget) reset();
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

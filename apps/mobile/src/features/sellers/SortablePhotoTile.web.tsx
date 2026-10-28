import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/reduced-motion';
import { designTokens } from '@bidplace/design-tokens';
import {
  photoDropIndex,
  photoPreviewIndex,
  type SortablePhotoTileProps,
} from './sortable-photo-tile';

export function SortablePhotoTile({
  id,
  index,
  count,
  columns,
  disabled,
  onMove,
  preview,
  onPreview,
  children,
}: SortablePhotoTileProps) {
  const node = useRef<HTMLDivElement>(null);
  const touch = useRef<{
    pointer: number;
    x: number;
    y: number;
    active: boolean;
    clientX: number;
    clientY: number;
    to: number;
    frame: number;
    timer: ReturnType<typeof setTimeout>;
    scrollTop: number;
  } | null>(null);
  const [translation, setTranslation] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = node.current;
    const preventPan = (event: TouchEvent) => {
      if (touch.current?.active) event.preventDefault();
    };
    element?.addEventListener('touchmove', preventPan, { passive: false });
    return () => {
      element?.removeEventListener('touchmove', preventPan);
      if (touch.current) {
        clearTimeout(touch.current.timer);
        cancelAnimationFrame(touch.current.frame);
      }
    };
  }, []);
  useLayoutEffect(() => {
    const grid = node.current?.closest<HTMLElement>(
      '[data-testid="photo-grid"]',
    );
    // Row keys can remount the tile; focus only after its new position commits.
    if (grid?.dataset.photoKeyboardFocus === id) {
      node.current?.focus();
      delete grid.dataset.photoKeyboardFocus;
    }
  }, [id, index]);
  const finish = (commit: boolean) => {
    const gesture = touch.current;
    if (!gesture) return;
    clearTimeout(gesture.timer);
    cancelAnimationFrame(gesture.frame);
    if (gesture.active && node.current?.hasPointerCapture(gesture.pointer))
      node.current.releasePointerCapture(gesture.pointer);
    touch.current = null;
    setTranslation({ x: 0, y: 0 });
    if (commit && gesture.active) onMove(id, gesture.to);
    onPreview?.(null);
  };
  const width = node.current?.offsetWidth ?? 0;
  const position = photoPreviewIndex(index, preview);
  const source = preview?.id === id;
  const offset = source
    ? { x: 0, y: 0 }
    : {
        x: ((position % columns) - (index % columns)) * (width + 12),
        y:
          (Math.floor(position / columns) - Math.floor(index / columns)) *
          ((width * 4) / 3 + 12),
      };
  return (
    <div
      ref={node}
      data-photo-id={id}
      data-photo-index={index}
      style={{
        width: '100%',
        position: 'relative',
        borderRadius: 22,
        zIndex: source ? 2 : 0,
        opacity: source && !touch.current?.active ? 0.35 : 1,
        // Mouse drop targets must stay on fixed cells while visual tiles move.
        pointerEvents: preview && !source ? 'none' : 'auto',
        transform: `translate(${offset.x + translation.x}px, ${offset.y + translation.y}px)`,
        transition:
          reduced || source
            ? 'none'
            : `transform ${designTokens.motion.control}ms ease`,
      }}
      onContextMenu={(event) => {
        if (touch.current) event.preventDefault();
      }}
      draggable={!disabled}
      tabIndex={disabled ? -1 : 0}
      role="listitem"
      aria-label={`Фото ${index + 1} из ${count}. Alt и стрелки меняют порядок.`}
      onDragStart={(event) => {
        if (
          disabled ||
          (event.target as HTMLElement).closest('button, [role="button"]')
        ) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData('text/plain', id);
        event.dataTransfer.effectAllowed = 'move';
        const box = event.currentTarget.getBoundingClientRect();
        event.dataTransfer.setDragImage(
          event.currentTarget,
          event.clientX - box.x,
          event.clientY - box.y,
        );
        onPreview?.({ id, from: index, to: index });
      }}
      onDragEnd={() => onPreview?.(null)}
      onPointerDown={(event) => {
        if (
          disabled ||
          event.pointerType !== 'touch' ||
          (event.target as HTMLElement).closest('button, [role="button"]')
        )
          return;
        let scroller = node.current?.parentElement ?? null;
        while (
          scroller &&
          !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)
        )
          scroller = scroller.parentElement;
        const gesture = {
          pointer: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          active: false,
          clientX: event.clientX,
          clientY: event.clientY,
          to: index,
          frame: 0,
          scrollTop: scroller?.scrollTop ?? 0,
          timer: setTimeout(() => {
            if (touch.current !== gesture || !node.current) return;
            gesture.active = true;
            node.current.setPointerCapture(gesture.pointer);
            const tick = () => {
              if (touch.current !== gesture) return;
              if (scroller) {
                const bounds = scroller.getBoundingClientRect();
                if (gesture.clientY < bounds.top + 44) scroller.scrollTop -= 12;
                if (gesture.clientY > bounds.bottom - 44)
                  scroller.scrollTop += 12;
              }
              const x = gesture.clientX - gesture.x;
              const y =
                gesture.clientY -
                gesture.y +
                (scroller?.scrollTop ?? 0) -
                gesture.scrollTop;
              const tileWidth = node.current?.offsetWidth ?? 0;
              gesture.to = photoDropIndex(
                index,
                count,
                columns,
                tileWidth,
                x,
                y,
              );
              setTranslation((previous) =>
                previous.x === x && previous.y === y ? previous : { x, y },
              );
              onPreview?.({ id, from: index, to: gesture.to });
              gesture.frame = requestAnimationFrame(tick);
            };
            tick();
          }, 250),
        };
        touch.current = gesture;
      }}
      onPointerMove={(event) => {
        const gesture = touch.current;
        if (!gesture) return;
        const x = event.clientX - gesture.x;
        if (!gesture.active) {
          if (Math.hypot(x, event.clientY - gesture.y) > 8) finish(false);
          return;
        }
        event.preventDefault();
        gesture.clientX = event.clientX;
        gesture.clientY = event.clientY;
      }}
      onPointerUp={() => finish(true)}
      onPointerCancel={() => finish(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          finish(false);
          onPreview?.(null);
        }
        if (!event.altKey || disabled || event.target !== event.currentTarget)
          return;
        const direction = {
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: -columns,
          ArrowDown: columns,
        }[event.key];
        if (direction !== undefined) {
          event.preventDefault();
          const target = Math.max(0, Math.min(count - 1, index + direction));
          const grid = event.currentTarget.closest<HTMLElement>(
            '[data-testid="photo-grid"]',
          );
          if (grid && target !== index) grid.dataset.photoKeyboardFocus = id;
          onMove(id, target);
        }
      }}
    >
      {children}
    </div>
  );
}

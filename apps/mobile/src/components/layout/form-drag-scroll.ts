import { createContext, useContext, useEffect, useRef } from 'react';
import {
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

type DragScroll = {
  begin: (pointerY: number, onScroll: (delta: number) => void) => void;
  update: (pointerY: number) => void;
  end: () => void;
};
export const FormDragScrollContext = createContext<DragScroll | null>(null);
export const useFormDragScroll = () => useContext(FormDragScrollContext);

export function useFormDragScrollOwner() {
  const ref = useRef<ScrollView>(null);
  const state = useRef({
    offset: 0,
    max: 0,
    contentHeight: 0,
    height: 0,
    top: 0,
    pointer: 0,
    start: 0,
    frame: 0,
  });
  const notify = useRef<((delta: number) => void) | null>(null);
  const end = () => {
    cancelAnimationFrame(state.current.frame);
    notify.current = null;
  };
  useEffect(() => end, []);
  return {
    ref,
    onScroll: (
      event: Pick<NativeSyntheticEvent<NativeScrollEvent>, 'nativeEvent'>,
    ) => {
      state.current.offset = event.nativeEvent.contentOffset.y;
      notify.current?.(state.current.offset - state.current.start);
    },
    onContentSizeChange: (_width: number, height: number) => {
      state.current.contentHeight = height;
      state.current.max = Math.max(0, height - state.current.height);
    },
    onLayout: () =>
      ref.current
        ?.getNativeScrollRef()
        ?.measureInWindow((_x, top, _width, height) => {
          state.current.top = top;
          state.current.height = height;
          state.current.max = Math.max(0, state.current.contentHeight - height);
        }),
    value: {
      begin: (pointerY, onScroll) => {
        end();
        const current = state.current;
        current.pointer = pointerY;
        current.start = current.offset;
        notify.current = onScroll;
        ref.current
          ?.getNativeScrollRef()
          ?.measureInWindow((_x, top, _width, height) => {
            current.top = top;
            current.height = height;
            current.max = Math.max(0, current.contentHeight - height);
          });
        const tick = () => {
          if (!notify.current) return;
          const step =
            current.pointer < current.top + 44
              ? -8
              : current.pointer > current.top + current.height - 44
                ? 8
                : 0;
          const target = Math.max(
            0,
            Math.min(current.max, current.offset + step),
          );
          if (target !== current.offset)
            ref.current?.scrollTo({ y: target, animated: false });
          current.frame = requestAnimationFrame(tick);
        };
        tick();
      },
      update: (pointerY) => {
        state.current.pointer = pointerY;
      },
      end,
    } satisfies DragScroll,
  };
}

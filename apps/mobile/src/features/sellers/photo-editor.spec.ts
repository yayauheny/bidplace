/** @vitest-environment jsdom */
import { act, createElement, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { flush } from '../../testing/dom';
import { originalPhotoEdit, type PhotoEdit } from '../../lib/media/photo-edit';

vi.unmock('./photo-editor');
const harness = vi.hoisted(() => ({
  edit: {
    rotate: 0,
    flipHorizontal: false,
    flipVertical: false,
    crop: null,
  } as PhotoEdit,
  frames: [] as { width: number; height: number }[],
  gestures: [] as {
    begin?: () => void;
    start?: (event: { absoluteY: number }) => void;
    end?: (event: { translationX: number }) => void;
    finalize?: () => void;
    update?: (event: {
      translationX: number;
      translationY: number;
      absoluteY?: number;
    }) => void;
  }[],
}));
vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  BackHandler: { addEventListener: () => ({ remove() {} }) },
  View: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
  Image: () => null,
}));
vi.mock('../../components/layout', () => ({
  FormPageShell: ({
    children,
    bottomAction,
  }: {
    children?: ReactNode;
    bottomAction?: ReactNode;
  }) => createElement('div', null, children, bottomAction),
}));
vi.mock('../../components/ui', () => ({
  AppText: ({
    children,
    accessibilityRole,
  }: {
    children?: ReactNode;
    accessibilityRole?: string;
  }) => createElement('span', { role: accessibilityRole }, children),
  MotionPressable: ({
    children,
    accessibilityLabel,
    onPress,
  }: {
    children?: ReactNode;
    accessibilityLabel?: string;
    onPress?: () => void;
  }) =>
    createElement(
      'button',
      { onClick: onPress, 'aria-label': accessibilityLabel },
      children,
    ),
  PrimaryButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) => createElement('button', { onClick: onPress, disabled }, label),
}));
vi.mock('../../components/figma/FigmaIcon', () => ({ FigmaIcon: () => null }));
vi.mock('../../components/figma/FigmaIconButton', () => ({
  FigmaIconButton: ({
    label,
    onPress,
  }: {
    label: string;
    onPress: () => void;
  }) => createElement('button', { onClick: onPress }, label),
}));
vi.mock('../../components/figma/FigmaTabs', () => ({ FigmaTabs: () => null }));
vi.mock('../../components/shared/CroppedPhoto', () => ({
  CroppedPhoto: () => null,
}));
vi.mock('../../components/ui/use-return-focus', () => ({
  useReturnFocus: () => ({ onOpenAutoFocus() {}, onCloseAutoFocus() {} }),
}));
vi.mock('../../providers/theme-provider', () => ({ useAppTheme: () => ({}) }));
vi.mock('../../lib/media/PhotoCropSurface', async () => {
  const { useImperativeHandle } = await import('react');
  return {
    PhotoCropSurface: ({ ref }: { ref: React.Ref<unknown> }) => {
      useImperativeHandle(ref, () => ({
        getEdit: () => harness.edit,
        rotate: () => {
          harness.edit.rotate = 90;
        },
        flip: () => undefined,
      }));
      return createElement('div', { 'data-testid': 'source' });
    },
  };
});
vi.mock('react-native-svg', () => ({ Svg: () => null, Path: () => null }));
vi.mock('react-native-zoom-toolkit', () => ({
  CropZoom: ({ cropSize }: { cropSize: { width: number; height: number } }) => {
    harness.frames.push(cropSize);
    return null;
  },
}));
vi.mock('../../lib/layout-transition', () => ({ sheetTimingConfig: {} }));
vi.mock('react-native-reanimated', () => ({
  default: {
    View: ({ children }: { children?: ReactNode }) =>
      createElement('div', null, children),
  },
  useSharedValue: (value: unknown) => useRef({ value }).current,
  useAnimatedStyle: () => ({}),
  withTiming: (value: number) => value,
}));
vi.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children?: ReactNode }) =>
    createElement('div', { 'data-gesture': true }, children),
  Gesture: {
    Pan: () => {
      const callbacks: (typeof harness.gestures)[number] = {};
      harness.gestures.push(callbacks);
      const gesture = {
        runOnJS: () => gesture,
        enabled: () => gesture,
        activateAfterLongPress: () => gesture,
        onStart: (cb: NonNullable<typeof callbacks.start>) => {
          callbacks.start = cb;
          return gesture;
        },
        onEnd: (cb: NonNullable<typeof callbacks.end>) => {
          callbacks.end = cb;
          return gesture;
        },
        onFinalize: (cb: NonNullable<typeof callbacks.finalize>) => {
          callbacks.finalize = cb;
          return gesture;
        },
        onBegin: (cb: () => void) => {
          callbacks.begin = cb;
          return gesture;
        },
        onUpdate: (cb: NonNullable<typeof callbacks.update>) => {
          callbacks.update = cb;
          return gesture;
        },
      };
      return gesture;
    },
  },
}));
import { PhotoEditor } from './photo-editor';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe('photo editor', () => {
  it.each([false, true])(
    'shows a preparation failure in the open editor and retries the same settings (avatar=%s)',
    async (avatar) => {
      const confirmed: PhotoEdit[] = [];
      harness.edit = { ...originalPhotoEdit };
      const container = document.createElement('div');
      document.body.append(container);
      const root = createRoot(container);
      function Owner() {
        const [error, setError] = useState<string | null>(null);
        const [done, setDone] = useState(false);
        const attempts = useRef(0);
        return done
          ? createElement('p', null, 'Сохранено')
          : createElement(PhotoEditor, {
              avatar,
              input: { uri: 'blob:retained', width: 80, height: 60 },
              confirmed: originalPhotoEdit,
              pending: false,
              error,
              onConfirm: (edit) => {
                confirmed.push(edit);
                if (++attempts.current === 1)
                  setError('Не удалось подготовить фото');
                else setDone(true);
              },
              onCancel: () => setDone(true),
            });
      }
      try {
        act(() => root.render(createElement(Owner)));
        act(() =>
          container
            .querySelector<HTMLButtonElement>('[aria-label="Повернуть 90°"]')!
            .click(),
        );
        const confirm = () =>
          [...container.querySelectorAll('button')].find(
            (b) => b.textContent === (avatar ? 'Установить фото' : 'Готово'),
          )!;
        act(() => confirm().click());
        await flush();
        expect(container.querySelector('[role="alert"]')?.textContent).toBe(
          'Не удалось подготовить фото',
        );
        expect(
          container.querySelector('[data-testid="source"]'),
        ).not.toBeNull();
        expect(container.textContent).toContain(
          avatar ? 'Закрыть редактор' : 'Назад',
        );
        act(() => confirm().click());
        await flush();
        expect(confirmed).toHaveLength(2);
        expect(confirmed[1]).toEqual(confirmed[0]);
        expect(confirmed[1]?.rotate).toBe(90);
        expect(container.textContent).toBe('Сохранено');
      } finally {
        act(() => root.unmount());
        container.remove();
      }
    },
  );

  it('resizes native crop bounds during updates before the gesture ends', async () => {
    const { PhotoCropSurface } = await vi.importActual<
      typeof import('../../lib/media/PhotoCropSurface')
    >('../../lib/media/PhotoCropSurface');
    harness.frames = [];
    harness.gestures = [];
    const root = createRoot(document.createElement('div'));
    try {
      act(() =>
        root.render(
          createElement(PhotoCropSurface, {
            uri: 'file://source',
            width: 800,
            height: 600,
            viewportWidth: 366,
            viewportHeight: 436,
            openingCrop: null,
            cropEnabled: true,
            avatar: false,
          }),
        ),
      );
      const start = harness.frames.at(-1)!;
      const gesture = harness.gestures.at(-1)!;
      act(() => gesture.begin!());
      act(() => gesture.update!({ translationX: 10, translationY: 10 }));
      expect(harness.frames.at(-1)).toEqual({
        width: start.width + 20,
        height: start.height + 20,
      });
      act(() => gesture.update!({ translationX: 10000, translationY: 10000 }));
      expect(harness.frames.at(-1)).toEqual({ width: 350, height: 420 });
      act(() =>
        gesture.update!({ translationX: -10000, translationY: -10000 }),
      );
      expect(harness.frames.at(-1)).toEqual({ width: 44, height: 44 });
    } finally {
      act(() => root.unmount());
    }
  });
});

describe('photo sorting preview', () => {
  it.each([
    [0, 2, [2, 0, 1, 3]],
    [3, 1, [0, 2, 3, 1]],
  ])(
    'reserves one insertion position from %i to %i',
    async (from, to, expected) => {
      const { photoPreviewIndex } = await import('./sortable-photo-tile');
      expect(
        [0, 1, 2, 3].map((index) =>
          photoPreviewIndex(index, { id: 'photo', from, to }),
        ),
      ).toEqual(expected);
      expect(
        [0, 1, 2, 3].map((index) => photoPreviewIndex(index, null)),
      ).toEqual([0, 1, 2, 3]);
    },
  );
});

describe('native photo drag integration', () => {
  it('keeps buttons outside the drag surface, includes scroll distance and cancels without committing', async () => {
    const { SortablePhotoTile } = await vi.importActual<
      typeof import('./SortablePhotoTile')
    >('./SortablePhotoTile');
    const { PhotoDragSurface } = await import('./photo-drag-surface');
    const { FormDragScrollContext } =
      await import('../../components/layout/form-drag-scroll');
    const move = vi.fn();
    const preview = vi.fn();
    let scrolled!: (delta: number) => void;
    const scroll = {
      begin: vi.fn((_pointer: number, callback: (delta: number) => void) => {
        scrolled = callback;
      }),
      update: vi.fn(),
      end: vi.fn(),
    };
    const container = document.createElement('div');
    const root = createRoot(container);
    try {
      act(() =>
        root.render(
          createElement(
            FormDragScrollContext,
            { value: scroll },
            createElement(SortablePhotoTile, {
              id: 'first',
              index: 0,
              count: 6,
              columns: 2,
              disabled: false,
              onMove: move,
              onPreview: preview,
              children: createElement(
                'div',
                null,
                createElement(
                  PhotoDragSurface,
                  null,
                  createElement('div', { 'data-photo-source': true }),
                  createElement('div', { 'data-local-preview': true }),
                ),
                createElement('button', null, 'Edit'),
                createElement('button', null, 'Delete'),
                createElement('button', null, 'Retry'),
              ),
            }),
          ),
        ),
      );
      expect(
        container.querySelector('[data-gesture] [data-photo-source]'),
      ).not.toBeNull();
      expect(container.querySelector('[data-gesture]')?.childElementCount).toBe(
        1,
      );
      expect(
        container.querySelector('[data-gesture] [data-local-preview]'),
      ).not.toBeNull();
      expect(container.querySelector('[data-gesture] button')).toBeNull();
      const gesture = harness.gestures.at(-1)!;
      act(() => gesture.start!({ absoluteY: 380 }));
      act(() =>
        gesture.update!({ translationX: 0, translationY: 10, absoluteY: 390 }),
      );
      act(() => scrolled(240));
      expect(preview).toHaveBeenLastCalledWith({ id: 'first', from: 0, to: 2 });
      act(() => gesture.finalize!());
      expect(move).not.toHaveBeenCalled();
      expect(scroll.end).toHaveBeenCalledOnce();
      expect(preview).toHaveBeenLastCalledWith(null);
      act(() => gesture.start!({ absoluteY: 380 }));
      act(() =>
        gesture.update!({ translationX: 0, translationY: 250, absoluteY: 390 }),
      );
      act(() => gesture.end!({ translationX: 0 }));
      act(() => gesture.finalize!());
      expect(move).toHaveBeenCalledWith('first', 2);
    } finally {
      act(() => root.unmount());
    }
  });
});

describe('form drag scrolling', () => {
  it('scrolls at either edge, reports actual distance and stops on cancellation/unmount', async () => {
    const { useFormDragScrollOwner } =
      await import('../../components/layout/form-drag-scroll');
    let owner!: ReturnType<typeof useFormDragScrollOwner>;
    let tick!: FrameRequestCallback;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        tick = callback;
        return 7;
      }),
    );
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const root = createRoot(document.createElement('div'));
    const scrollTo = vi.fn();
    const notify = vi.fn();
    function Probe() {
      owner = useFormDragScrollOwner();
      return null;
    }
    try {
      act(() => root.render(createElement(Probe)));
      Object.assign(owner.ref, {
        current: {
          scrollTo,
          getNativeScrollRef: () => ({
            measureInWindow: (
              callback: (
                x: number,
                y: number,
                width: number,
                height: number,
              ) => void,
            ) => callback(0, 100, 390, 400),
          }),
        },
      });
      owner.onLayout();
      owner.onContentSizeChange(390, 1000);
      owner.value.begin(480, notify);
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 8, animated: false });
      const scrollEvent = (
        offset: number,
      ): Parameters<typeof owner.onScroll>[0] => ({
        nativeEvent: {
          contentInset: { top: 0, left: 0, bottom: 0, right: 0 },
          contentOffset: { x: 0, y: offset },
          contentSize: { width: 390, height: 1000 },
          layoutMeasurement: { width: 390, height: 400 },
          zoomScale: 1,
        },
      });
      owner.onScroll(scrollEvent(8));
      expect(notify).toHaveBeenLastCalledWith(8);
      owner.value.update(110);
      tick(16);
      expect(scrollTo).toHaveBeenLastCalledWith({ y: 0, animated: false });
      owner.value.end();
      expect(cancel).toHaveBeenLastCalledWith(7);
      scrollTo.mockClear();
      tick(32);
      expect(scrollTo).not.toHaveBeenCalled();
      owner.value.begin(480, notify);
      act(() => root.unmount());
      scrollTo.mockClear();
      tick(48);
      expect(scrollTo).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

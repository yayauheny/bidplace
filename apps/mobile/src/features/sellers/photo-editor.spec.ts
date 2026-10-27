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
    update?: (event: { translationX: number; translationY: number }) => void;
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
vi.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children?: ReactNode }) => children,
  Gesture: {
    Pan: () => {
      const callbacks: (typeof harness.gestures)[number] = {};
      harness.gestures.push(callbacks);
      const gesture = {
        runOnJS: () => gesture,
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

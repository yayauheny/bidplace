import { vi } from 'vitest';

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  SafeAreaView: ({ children }: { children: unknown }) => children,
}));

// Vitest runs on the JS thread; the native UI-thread bridge is exercised by Expo.
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: <Args extends unknown[]>(
    callback: (...args: Args) => unknown,
    ...args: Args
  ) => callback(...args),
}));

// Native gestures are covered by device acceptance; owner tests drive the editor contract.
vi.mock('../src/lib/media/PhotoCropSurface', () => ({
  PhotoCropSurface: () => null,
}));
vi.mock('../src/features/sellers/SortablePhotoTile', () => ({
  SortablePhotoTile: ({ children }: { children: unknown }) => children,
}));
vi.mock('../src/features/sellers/photo-editor', async () => {
  const { createElement } = await import('react');
  return {
    PhotoEditor: ({
      avatar,
      onConfirm,
      onCancel,
    }: {
      avatar?: boolean;
      onConfirm: (edit: {
        rotate: number;
        flipHorizontal: boolean;
        flipVertical: boolean;
        crop: null;
      }) => void;
      onCancel: () => void;
    }) =>
      createElement(
        'div',
        null,
        createElement(
          'button',
          {
            onClick: () =>
              onConfirm({
                rotate: 0,
                flipHorizontal: false,
                flipVertical: false,
                crop: null,
              }),
          },
          avatar ? 'Установить фото' : 'Готово',
        ),
        createElement('button', { onClick: onCancel }, 'Закрыть редактор'),
      ),
  };
});

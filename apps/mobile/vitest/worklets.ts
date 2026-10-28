import { vi } from 'vitest';

// react-native-svg's package entry parses as Native code under plain Node.
// Owner specs may replace this stub with a richer mock.
vi.mock('react-native-svg', () => {
  const stub = () => null;
  return {
    default: stub,
    Svg: stub,
    Circle: stub,
    Ellipse: stub,
    G: stub,
    Path: stub,
    Defs: stub,
    LinearGradient: stub,
    Rect: stub,
    Stop: stub,
    Line: stub,
    Polyline: stub,
    SvgXml: stub,
  };
});

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

// Native Expo hashing uses the same SHA-256 contract through Node in owner tests.
vi.mock('expo-crypto', async () => {
  const { createHash } = await import('node:crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digest: async (algorithm: string, data: ArrayBuffer) =>
      Uint8Array.from(
        createHash(algorithm).update(new Uint8Array(data)).digest(),
      ).buffer,
  };
});

if (typeof URL.revokeObjectURL !== 'function') URL.revokeObjectURL = vi.fn();

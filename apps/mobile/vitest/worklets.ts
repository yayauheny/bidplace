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

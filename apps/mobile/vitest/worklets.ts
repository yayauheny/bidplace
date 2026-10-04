import { vi } from 'vitest';

// Vitest runs on the JS thread; the native UI-thread bridge is exercised by Expo.
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: <Args extends unknown[]>(
    callback: (...args: Args) => unknown,
    ...args: Args
  ) => callback(...args),
}));

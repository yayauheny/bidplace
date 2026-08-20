import AsyncStorage from '@react-native-async-storage/async-storage';

export type AnalyticsStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

let storage: AnalyticsStorage = AsyncStorage;

export function setStorageForTests(next: AnalyticsStorage | null): void {
  storage = next ?? AsyncStorage;
}

export async function getStoredString(key: string): Promise<string | null> {
  return storage.getItem(key);
}

export async function setStoredString(
  key: string,
  value: string,
): Promise<void> {
  await storage.setItem(key, value);
}

export async function removeStoredString(key: string): Promise<void> {
  await storage.removeItem(key);
}

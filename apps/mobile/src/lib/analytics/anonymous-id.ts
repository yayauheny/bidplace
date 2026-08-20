import {
  getStoredString,
  removeStoredString,
  setStoredString,
} from './storage';

export const ANONYMOUS_ID_KEY = 'bidplace.analytics.anonymousId';

let cachedAnonymousId: string | null = null;
let pendingAnonymousId: Promise<string> | null = null;

export async function getOrCreateAnonymousId(): Promise<string> {
  if (cachedAnonymousId) {
    return cachedAnonymousId;
  }

  if (pendingAnonymousId) {
    return pendingAnonymousId;
  }

  pendingAnonymousId = (async () => {
    const existing = await getStoredString(ANONYMOUS_ID_KEY);
    if (existing) {
      cachedAnonymousId = existing;
      return existing;
    }

    const created = crypto.randomUUID();
    await setStoredString(ANONYMOUS_ID_KEY, created);
    cachedAnonymousId = created;
    return created;
  })();

  try {
    return await pendingAnonymousId;
  } finally {
    pendingAnonymousId = null;
  }
}

export async function resetAnonymousIdForTests(): Promise<void> {
  cachedAnonymousId = null;
  pendingAnonymousId = null;
  await removeStoredString(ANONYMOUS_ID_KEY);
}

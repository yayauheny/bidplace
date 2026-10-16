import type { ZodType } from 'zod';

import { logInfrastructureError } from '../errors';

/**
 * Local (browser-only) form draft storage. Keys are scoped to the account and
 * the concrete form/work so drafts never leak across users or entities.
 * All operations are best-effort: a missing or broken storage must never
 * break the form. `localStorage` does not exist in the native runtime, so
 * the typeof guard alone keeps this module web-only.
 */

export const FORM_DRAFT_PREFIX = 'bidplace:draft:';

export function formDraftKey(
  accountId: string,
  scope: string,
  entityId = 'new',
): string {
  return `${FORM_DRAFT_PREFIX}${accountId}:${scope}:${entityId}`;
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * Per-account write epoch. `clearAccountFormDrafts` (logout) bumps it;
 * delayed writers compare the epoch captured at schedule time with the
 * current one and drop the write after retirement.
 */
const accountDraftEpochs = new Map<string, number>();

export function accountDraftEpoch(accountId: string): number {
  return accountDraftEpochs.get(accountId) ?? 0;
}

/** True when a small probe write succeeds — storage is usable for drafts. */
export function storageWritable(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    const probe = `${FORM_DRAFT_PREFIX}probe`;
    store.setItem(probe, '1');
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Returns the parsed draft, or null when absent, invalid, or unreadable. */
export function readFormDraft<T>(key: string, schema: ZodType<T>): T | null {
  const store = storage();
  if (!store) return null;
  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch (error) {
    logInfrastructureError(error, 'local-form-draft:read');
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch (error) {
    logInfrastructureError(error, 'local-form-draft:parse');
    return null;
  }
}

/** Persists the draft. Returns false when storage is unavailable or fails. */
export function writeFormDraft(key: string, value: unknown): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    logInfrastructureError(error, 'local-form-draft:write');
    return false;
  }
}

export function clearFormDraft(key: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(key);
  } catch (error) {
    logInfrastructureError(error, 'local-form-draft:clear');
  }
}

/** Removes every draft belonging to the account (logout boundary). */
export function clearAccountFormDrafts(accountId: string): void {
  // Bump the write epoch first so writers debounced before the clear drop
  // their pending write instead of resurrecting the private draft.
  accountDraftEpochs.set(
    accountId,
    (accountDraftEpochs.get(accountId) ?? 0) + 1,
  );
  const store = storage();
  if (!store) return;
  const prefix = `${FORM_DRAFT_PREFIX}${accountId}:`;
  const stale: string[] = [];
  try {
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (key?.startsWith(prefix)) stale.push(key);
    }
    for (const key of stale) store.removeItem(key);
  } catch (error) {
    logInfrastructureError(error, 'local-form-draft:clear-account');
  }
}

/**
 * Debounced writer for live editing: flushes at most once per interval and
 * always flushes the latest value. The timer is unref'd so it never keeps a
 * server render alive; in the browser the interval is what matters.
 */
export function createDraftWriter(intervalMs = 400): {
  schedule: (write: () => void) => void;
  flush: () => void;
  cancel: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: (() => void) | null = null;
  return {
    schedule(write) {
      pending = write;
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        const run = pending;
        pending = null;
        run?.();
      }, intervalMs);
    },
    flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      const run = pending;
      pending = null;
      run?.();
    },
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      pending = null;
    },
  };
}

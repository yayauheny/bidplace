/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import {
  FORM_DRAFT_PREFIX,
  clearAccountFormDrafts,
  clearFormDraft,
  createDraftWriter,
  formDraftKey,
  readFormDraft,
  writeFormDraft,
} from './local-form-draft';

const schema = z.object({
  base: z.string().nullable(),
  values: z.record(z.string(), z.unknown()),
});

describe('local form draft storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('round-trips a draft through the account-scoped key', () => {
    const key = formDraftKey('user-a', 'product-draft', 'work-1');
    expect(key).toBe(`${FORM_DRAFT_PREFIX}user-a:product-draft:work-1`);
    expect(
      writeFormDraft(key, { base: null, values: { title: 'Черновик' } }),
    ).toBe('ok');
    expect(readFormDraft(key, schema)).toEqual({
      base: null,
      values: { title: 'Черновик' },
    });
    clearFormDraft(key);
    expect(readFormDraft(key, schema)).toBeNull();
  });

  it('drops corrupt or schema-mismatched payloads instead of throwing', () => {
    const key = formDraftKey('user-a', 'seller-application');
    window.localStorage.setItem(key, '{not json');
    expect(readFormDraft(key, schema)).toBeNull();
    window.localStorage.setItem(key, JSON.stringify({ base: 1 }));
    expect(readFormDraft(key, schema)).toBeNull();
  });

  it('clears only the drafts of the logged-out account', () => {
    writeFormDraft(formDraftKey('user-a', 'product-draft'), {
      base: null,
      values: {},
    });
    writeFormDraft(formDraftKey('user-a', 'seller-application'), {
      base: null,
      values: {},
    });
    writeFormDraft(formDraftKey('user-b', 'product-draft'), {
      base: null,
      values: {},
    });
    clearAccountFormDrafts('user-a');
    expect(
      readFormDraft(formDraftKey('user-a', 'product-draft'), schema),
    ).toBeNull();
    expect(
      readFormDraft(formDraftKey('user-a', 'seller-application'), schema),
    ).toBeNull();
    expect(
      readFormDraft(formDraftKey('user-b', 'product-draft'), schema),
    ).not.toBeNull();
  });

  it('reports a failed write when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    });
    expect(
      writeFormDraft(formDraftKey('user-a', 'product-draft'), {
        base: null,
        values: {},
      }),
    ).toBe('failed');
  });

  it('distinguishes a missing API from a denied one', () => {
    vi.stubGlobal('localStorage', undefined);
    try {
      expect(
        writeFormDraft(formDraftKey('user-a', 'product-draft'), {
          base: null,
          values: {},
        }),
      ).toBe('unsupported');
    } finally {
      vi.unstubAllGlobals();
    }
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError');
      },
    });
    try {
      // The API exists but access itself throws: a broken storage, so the
      // write reports 'failed' and callers show the warning.
      expect(
        writeFormDraft(formDraftKey('user-a', 'product-draft'), {
          base: null,
          values: {},
        }),
      ).toBe('failed');
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
      else delete (window as { localStorage?: Storage }).localStorage;
    }
  });

  it('debounces writes and flushes the latest value only', () => {
    vi.useFakeTimers();
    const writer = createDraftWriter(400);
    const writes: string[] = [];
    writer.schedule(() => writes.push('first'));
    writer.schedule(() => writes.push('latest'));
    vi.advanceTimersByTime(400);
    expect(writes).toEqual(['latest']);
    writer.schedule(() => writes.push('flushed'));
    writer.flush();
    expect(writes).toEqual(['latest', 'flushed']);
    writer.schedule(() => writes.push('cancelled'));
    writer.cancel();
    vi.advanceTimersByTime(400);
    expect(writes).toEqual(['latest', 'flushed']);
  });
});

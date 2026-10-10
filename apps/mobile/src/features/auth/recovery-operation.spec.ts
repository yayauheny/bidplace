import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createOperationKey,
  createRecoveryOperation,
  recoveryAfter,
  recoveryKeyFor,
} from './recovery-operation';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9:_-]{8,80}$/;
const RANDOM_UNAVAILABLE = 'A secure random source is required for a recovery key';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('recovery operation keys', () => {
  it('creates the key on the real action and keeps it required there', () => {
    const real = globalThis.crypto;
    let reads = 0;
    vi.stubGlobal('crypto', {
      randomUUID() {
        reads += 1;
        return real.randomUUID();
      },
      getRandomValues: real.getRandomValues.bind(real),
    });

    const created = createRecoveryOperation();
    expect(reads).toBe(0);
    expect(created.key).toBeNull();
    expect(created.email).toBeNull();
    expect(created.rotate).toBe(false);
    expect(recoveryAfter(created, 'new').key).toBeNull();
    expect(reads).toBe(0);

    const submitted = recoveryKeyFor(created, '  Person@Example.com ');
    expect(reads).toBe(1);
    expect(submitted.key).toMatch(UUID_V4);
    expect(submitted.key).toMatch(IDEMPOTENCY_KEY);
    expect(submitted.email).toBe('person@example.com');
    expect(submitted.rotate).toBe(false);
  });

  it('creates distinct keys when the clock does not advance', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const first = createOperationKey();
    const second = createOperationKey();
    const third = recoveryKeyFor(createRecoveryOperation(), 'person@example.com');
    const fourth = recoveryKeyFor(createRecoveryOperation(), 'person@example.com');

    expect(new Set([first, second, third.key, fourth.key]).size).toBe(4);
    expect(first).not.toContain(Date.now().toString(36));
    expect(third.key).not.toBe(fourth.key);
  });

  it('creates distinct keys from secure bytes when randomUUID is missing', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    let issued = 0;
    vi.stubGlobal('crypto', {
      getRandomValues(bytes: Uint8Array) {
        issued += 1;
        const buffer = new ArrayBuffer(bytes.byteLength);
        const view = new DataView(buffer);
        for (let index = 0; index < buffer.byteLength; index += 1) {
          view.setUint8(index, (issued * 31 + index) % 256);
        }
        bytes.set(new Uint8Array(buffer));
        return bytes;
      },
    });

    const first = createOperationKey();
    const second = createOperationKey();

    expect(first).not.toBe(second);
    expect(first).toMatch(UUID_V4);
    expect(second).toMatch(UUID_V4);
    expect(first).not.toContain('1700000000000');
  });

  it('fails when secure bytes are missing or not a uuid', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    vi.stubGlobal('crypto', undefined);
    expect(() => createRecoveryOperation()).not.toThrow();
    expect(() => createOperationKey()).toThrow(RANDOM_UNAVAILABLE);
    expect(() => recoveryKeyFor(createRecoveryOperation(), 'person@example.com')).toThrow(RANDOM_UNAVAILABLE);

    vi.stubGlobal('crypto', {
      randomUUID: () => `op${Date.now().toString(36)}`,
    });
    expect(() => createOperationKey()).toThrow(RANDOM_UNAVAILABLE);

    vi.stubGlobal('crypto', {
      randomUUID() {
        throw new Error('randomUUID unavailable');
      },
    });
    expect(() => createOperationKey()).toThrow('randomUUID unavailable');
  });

  it('keeps the same normalized address and key on an uncertain retry', () => {
    const submitted = recoveryKeyFor(createRecoveryOperation(), 'person@example.com');
    const uncertain = recoveryAfter(submitted, 'uncertain');
    const retried = recoveryKeyFor(uncertain, '  PERSON@example.com ');

    expect(uncertain).toBe(submitted);
    expect(retried.key).toBe(submitted.key);
    expect(retried.email).toBe('person@example.com');
    expect(retried.rotate).toBe(false);
  });

  it('rotates after refusal, completion, a new operation, or an address change', () => {
    const submitted = recoveryKeyFor(createRecoveryOperation(), 'person@example.com');

    for (const attempt of ['refused', 'new'] as const) {
      const marked = recoveryAfter(submitted, attempt);
      const next = recoveryKeyFor(marked, 'person@example.com');
      expect(marked.rotate).toBe(true);
      expect(marked.key).toBe(submitted.key);
      expect(next.key).not.toBe(submitted.key);
      expect(next.email).toBe('person@example.com');
      expect(next.rotate).toBe(false);
    }

    const moved = recoveryKeyFor(recoveryAfter(submitted, 'uncertain'), 'other@example.com');
    expect(moved.key).not.toBe(submitted.key);
    expect(moved.email).toBe('other@example.com');

    const replacement = recoveryKeyFor(createRecoveryOperation(), 'person@example.com');
    expect(replacement.key).not.toBe(submitted.key);
  });
});

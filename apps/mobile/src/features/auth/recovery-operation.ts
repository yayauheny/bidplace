export type RecoveryAttempt = 'uncertain' | 'refused' | 'new';

export type RecoveryOperation = {
  key: string | null;
  email: string | null;
  rotate: boolean;
};

export type ReadyRecoveryOperation = {
  key: string;
  email: string;
  rotate: false;
};

const RANDOM_UNAVAILABLE = 'A secure random source is required for a recovery key';
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeRecoveryEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isUuid(value: string): boolean {
  return UUID_V4.test(value);
}

function uuidFromRandomBytes(fill: (bytes: Uint8Array<ArrayBuffer>) => void): string {
  const buffer = new ArrayBuffer(16);
  const bytes = new Uint8Array(buffer);
  fill(bytes);
  const view = new DataView(buffer);
  view.setUint8(6, (view.getUint8(6) & 0x0f) | 0x40);
  view.setUint8(8, (view.getUint8(8) & 0x3f) | 0x80);
  let hex = '';
  for (let index = 0; index < buffer.byteLength; index += 1) {
    hex += view.getUint8(index).toString(16).padStart(2, '0');
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createOperationKey(): string {
  const source = globalThis.crypto;
  if (typeof source?.randomUUID === 'function') {
    try {
      const generated = source.randomUUID();
      if (isUuid(generated)) return generated;
    } catch (error) {
      if (typeof source.getRandomValues !== 'function') {
        throw error instanceof Error ? error : new Error(RANDOM_UNAVAILABLE);
      }
    }
  }

  if (typeof source?.getRandomValues !== 'function') {
    throw new Error(RANDOM_UNAVAILABLE);
  }

  const readBytes = source.getRandomValues;
  const key = uuidFromRandomBytes((bytes) => {
    readBytes.call(source, bytes);
  });
  if (!isUuid(key)) throw new Error(RANDOM_UNAVAILABLE);
  return key;
}

export function createRecoveryOperation(): RecoveryOperation {
  return { key: null, email: null, rotate: false };
}

export function recoveryKeyFor(state: RecoveryOperation, email: string): ReadyRecoveryOperation {
  const normalized = normalizeRecoveryEmail(email);
  if (state.key && !state.rotate && state.email === normalized) {
    return { key: state.key, email: normalized, rotate: false };
  }
  return { key: createOperationKey(), email: normalized, rotate: false };
}

export function recoveryAfter(state: RecoveryOperation, attempt: RecoveryAttempt): RecoveryOperation {
  if (attempt === 'uncertain') return state;
  return { key: state.key, email: state.email, rotate: true };
}

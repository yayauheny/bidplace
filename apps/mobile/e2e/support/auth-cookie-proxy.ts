import { expect } from '@playwright/test';

export type HeldAuthWrite = '/api/auth/login' | '/api/auth/register' | '/api/auth/logout';

const STATUS_KEYS = [
  'pending',
  'held',
  'abandoned',
  'method',
  'path',
  'succeeded',
  'hasSetCookie',
] as const;

export type AuthCookieProxyStatus = {
  pending: boolean;
  held: boolean;
  abandoned: boolean;
  method: string;
  path: string;
  succeeded: boolean;
  hasSetCookie: boolean;
};

function controlURL(): string {
  const port = process.env.E2E_AUTH_COOKIE_PROXY_CONTROL_PORT?.trim();
  if (!port) throw new Error('E2E_AUTH_COOKIE_PROXY_CONTROL_PORT is required');
  return `http://127.0.0.1:${port}`;
}

async function control(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${controlURL()}${path}`, init);
}

export async function armAuthWriteHold(path: HeldAuthWrite): Promise<void> {
  const response = await control('/arm', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ method: 'POST', path }),
  });
  if (!response.ok) throw new Error('Auth cookie proxy did not arm the next write');
}

function readStatus(body: unknown): AuthCookieProxyStatus {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Auth cookie proxy status exposed an unexpected field');
  }
  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);
  if (
    keys.length !== STATUS_KEYS.length
    || keys.some((key) => !STATUS_KEYS.includes(key as typeof STATUS_KEYS[number]))
  ) {
    throw new Error('Auth cookie proxy status exposed an unexpected field');
  }
  const pending = record.pending;
  const held = record.held;
  const abandoned = record.abandoned;
  const method = record.method;
  const path = record.path;
  const succeeded = record.succeeded;
  const hasSetCookie = record.hasSetCookie;
  if (
    typeof pending !== 'boolean'
    || typeof held !== 'boolean'
    || typeof abandoned !== 'boolean'
    || typeof method !== 'string'
    || typeof path !== 'string'
    || typeof succeeded !== 'boolean'
    || typeof hasSetCookie !== 'boolean'
  ) {
    throw new Error('Auth cookie proxy status exposed an unexpected field');
  }
  return { pending, held, abandoned, method, path, succeeded, hasSetCookie };
}

export async function waitForHeldAuthWrite(): Promise<void> {
  await expect.poll(async () => {
    const response = await control('/status');
    const status = readStatus(await response.json());
    if (status.held && (!status.succeeded || !status.hasSetCookie)) {
      throw new Error('Held auth write was not a successful cookie response');
    }
    return status.held && status.succeeded && status.hasSetCookie;
  }).toBe(true);
}

export async function releaseHeldAuthWrite(): Promise<void> {
  const response = await control('/release', { method: 'POST' });
  if (response.status !== 204) throw new Error('Auth cookie proxy did not release the held write');
}

/** Drops owned armed and held proxy state. Success is only HTTP 204. */
export async function cleanupAuthCookieProxyHold(): Promise<void> {
  const response = await control('/reset', { method: 'POST' });
  if (response.status !== 204) {
    throw new Error(`Auth cookie proxy reset failed with status ${response.status}`);
  }
}

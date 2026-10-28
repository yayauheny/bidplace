import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect } from '@playwright/test';

const fallbackMailPath = resolve(__dirname, '../.email.jsonl');

export function taskMailPath(): string {
  const override = process.env.E2E_TEST_EMAIL_FILE?.trim() || process.env.TEST_EMAIL_FILE?.trim();
  return override ? resolve(override) : fallbackMailPath;
}

async function readMailLines(): Promise<string[]> {
  try {
    const contents = await readFile(taskMailPath(), 'utf8');
    return contents.trim().split('\n').filter(Boolean);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }
}

function messageField(message: unknown, email: string, field: 'code' | 'token'): string | undefined {
  if (typeof message !== 'object' || message === null || !('email' in message)) return undefined;
  if (message.email !== email) return undefined;
  const candidate = field === 'code'
    ? ('code' in message ? message.code : undefined)
    : ('token' in message ? message.token : undefined);
  return typeof candidate === 'string' ? candidate : undefined;
}

export async function localTestMailValue(email: string, field: 'code' | 'token'): Promise<string> {
  let value: string | undefined;
  await expect
    .poll(
      async () => {
        for (const line of await readMailLines()) {
          const candidate = messageField(JSON.parse(line) as unknown, email, field);
          if (candidate) value = candidate;
        }
        return Boolean(value);
      },
      { message: 'Local test transport delivered the expected email' },
    )
    .toBe(true);
  if (!value) throw new Error('Expected local test email value is missing');
  return value;
}

export async function localTestMailHas(email: string, field: 'code' | 'token'): Promise<boolean> {
  for (const line of await readMailLines()) {
    if (messageField(JSON.parse(line) as unknown, email, field)) return true;
  }
  return false;
}

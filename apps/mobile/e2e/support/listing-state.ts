import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { expect, type APIRequestContext } from '@playwright/test';

const execFileAsync = promisify(execFile);
const apiBaseURL = 'http://127.0.0.1:3001';

export async function waitForListingStatus(
  request: Pick<APIRequestContext, 'get'>,
  publicId: string,
  status: string,
) {
  await expect.poll(async () => {
    const response = await request.get(`${apiBaseURL}/api/products/${publicId}`);
    expect(response.ok()).toBeTruthy();
    return (await response.json()).listing?.status ?? null;
  }, { timeout: 90_000, intervals: [1_000, 3_000] }).toBe(status);
}

export async function closeListing(listingId: string, endsAt: Date) {
  await execFileAsync(process.execPath, ['apps/mobile/e2e/run-close.mjs', listingId, endsAt.toISOString()], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      APP_ENV: 'local',
      API_PORT: '3001',
      CORS_ORIGIN: 'http://127.0.0.1:8081',
      DATABASE_URL: 'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e?schema=public',
      E2E_DATABASE_URL: 'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e?schema=public',
      JWT_SECRET: 'e2e-jwt-secret',
    },
  });
}

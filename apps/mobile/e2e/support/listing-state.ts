import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect, type APIRequestContext } from '@playwright/test';
import { e2eApiBaseURL, e2eDatabaseURL, e2eWebBaseURL } from './e2e-env';

const execFileAsync = promisify(execFile);
const apiBaseURL = e2eApiBaseURL;

export async function waitForListingStatus(
  request: Pick<APIRequestContext, 'get'>,
  publicId: string,
  status: string,
) {
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `${apiBaseURL}/api/products/${publicId}`,
        );
        expect(response.ok()).toBeTruthy();
        return (await response.json()).listing?.status ?? null;
      },
      { timeout: 90_000, intervals: [1_000, 3_000] },
    )
    .toBe(status);
}

export async function closeListing(listingId: string, endsAt: Date) {
  await execFileAsync(
    process.execPath,
    [
      resolve(__dirname, '..', 'run-close.mjs'),
      listingId,
      endsAt.toISOString(),
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        APP_ENV: 'local',
        API_PORT: new URL(apiBaseURL).port || '80',
        CORS_ORIGIN: e2eWebBaseURL,
        DATABASE_URL: e2eDatabaseURL,
        E2E_DATABASE_URL: e2eDatabaseURL,
        JWT_SECRET: 'e2e-jwt-secret',
      },
    },
  );
}

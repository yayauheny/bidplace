import { defineConfig } from '@playwright/test';

// Maintained mobile-web release gate. Visual 390 Chromium+WebKit coverage
// is `test:e2e:stabilization`. Auction/Pen specs were deleted with commerce
// chrome and must not be reintroduced without an explicit ignore reason.

const apiPort = process.env.E2E_API_PORT ?? '3001';
const webPort = process.env.E2E_WEB_PORT ?? '8081';
const apiBaseURL = `http://localhost:${apiPort}`;
const webBaseURL = `http://localhost:${webPort}`;
const databaseUrl =
  process.env.E2E_DATABASE_URL ??
  'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e?schema=public';

export default defineConfig({
  testDir: './e2e',
  // R2 transport fault scenarios have their own server in playwright.media.config.ts.
  testIgnore: '**/work-media-lifecycle.spec.ts',
  globalTimeout: 45 * 60_000,
  timeout: 60_000,
  workers: 1,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  use: {
    baseURL: webBaseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command:
        'corepack pnpm --filter @bidplace/database generate && corepack pnpm --filter @bidplace/api... build && node apps/mobile/e2e/prepare.mjs && node apps/api/dist/main.js',
      cwd: '../..',
      url: `${apiBaseURL}/api/health/ready`,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'test',
        APP_ENV: 'local',
        API_PORT: apiPort,
        E2E_API_PORT: apiPort,
        E2E_WEB_PORT: webPort,
        CORS_ORIGIN: webBaseURL,
        TRUST_PROXY: 'true',
        DATABASE_URL: databaseUrl,
        E2E_DATABASE_URL: databaseUrl,
        JWT_SECRET: 'e2e-jwt-secret',
        TEST_EMAIL_FILE: 'apps/mobile/e2e/.email.jsonl',
      },
    },
    {
      command: `corepack pnpm --filter @bidplace/mobile run build:api-client && corepack pnpm --filter @bidplace/design-tokens build && corepack pnpm --filter @bidplace/mobile exec expo start --web --clear --port ${webPort}`,
      cwd: '../..',
      url: webBaseURL,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'development',
        EXPO_PUBLIC_API_URL: apiBaseURL,
      },
    },
  ],
});

import { defineConfig } from '@playwright/test';

const apiPort = process.env.E2E_API_PORT ?? '3003';
const webPort = process.env.E2E_WEB_PORT ?? '8093';
const apiBaseURL = `http://localhost:${apiPort}`;
const webBaseURL = `http://localhost:${webPort}`;
const databaseUrl =
  process.env.E2E_DATABASE_URL ??
  'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e?schema=public';

export default defineConfig({
  testDir: './e2e',
  testMatch: [
    'figma-stabilization.spec.ts',
    'home-figma.spec.ts',
    'visual/home-opening-figma.spec.ts',
    'discovery-launch.spec.ts',
    'author-header-motion.spec.ts',
    'product-layout.spec.ts',
    'auth-layout.spec.ts',
    'figma-cover-frost.spec.ts',
  ],
  timeout: 90_000,
  globalTimeout: 12 * 60_000,
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
        'corepack pnpm --filter @bidplace/api... build && node apps/mobile/e2e/prepare.mjs && node apps/api/dist/main.js',
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
      command: `corepack pnpm --filter @bidplace/mobile exec expo start --web --clear --port ${webPort}`,
      cwd: '../..',
      url: webBaseURL,
      reuseExistingServer: false,
      env: { EXPO_PUBLIC_API_URL: apiBaseURL },
    },
  ],
});

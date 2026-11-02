import { defineConfig } from '@playwright/test';

const webPort = '8094';
const webBaseURL = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: ['commerce-lot.spec.ts'],
  timeout: 120_000,
  workers: 1,
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  use: {
    baseURL: webBaseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `corepack pnpm --filter @bidplace/mobile exec expo start --web --port ${webPort}`,
    cwd: '../..',
    url: webBaseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      EXPO_NO_DOTENV: '1',
      EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3001',
    },
  },
});

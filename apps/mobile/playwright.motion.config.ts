import { defineConfig } from '@playwright/test';

const webPort = process.env.MOTION_WEB_PORT ?? '8085';
const webBaseURL = process.env.MOTION_BASE_URL ?? `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /author-header-motion\.spec\.ts/,
  timeout: 90_000,
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
  webServer: {
    command: `corepack pnpm exec expo start --web --port ${webPort}`,
    cwd: '.',
    url: webBaseURL,
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3002',
    },
  },
});

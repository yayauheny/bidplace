import { defineConfig } from '@playwright/test';

const webPort = '8091';
const webBaseURL = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'figma-text-field-focus.spec.ts',
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
  webServer: {
    command: `corepack pnpm --filter @bidplace/mobile exec expo start --web --port ${webPort}`,
    cwd: '../..',
    url: webBaseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3001',
    },
  },
});

import { defineConfig } from '@playwright/test';

const port = 8094;
export default defineConfig({
  testDir: './e2e', testMatch: ['commerce-lot.spec.ts'], timeout: 120_000, workers: 1,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  webServer: {
    command: `corepack pnpm --filter @bidplace/mobile exec expo start --web --port ${port}`,
    cwd: '../..', url: `http://127.0.0.1:${port}`, reuseExistingServer: false, timeout: 180_000,
    env: { EXPO_NO_DOTENV: '1', EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3001' },
  },
});

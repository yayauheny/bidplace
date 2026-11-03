import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', testMatch: 'commerce-live.spec.ts',
  timeout: 60_000, workers: 1, retries: 0,
  outputDir: './test-results/commerce-live',
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  use: { baseURL: 'http://127.0.0.1:3011', trace: 'off', screenshot: 'only-on-failure', video: 'off' },
  webServer: {
    command: 'node e2e/commerce-web-server.mjs',
    url: 'http://127.0.0.1:3011', reuseExistingServer: false,
  },
});

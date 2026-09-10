import { defineConfig } from '@playwright/test';

const webBaseURL = process.env.E2E_WEB_URL ?? 'http://127.0.0.1:8081';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['figma-shared-controls.spec.ts', 'figma-home.spec.ts'],
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: webBaseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});

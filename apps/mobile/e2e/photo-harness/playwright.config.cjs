const path = require('node:path');
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: 'photo-pipeline.spec.cjs',
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:8182',
    headless: true,
    viewport: { width: 900, height: 900 },
  },
  webServer: {
    command: 'pnpm exec expo start --web --port 8182',
    cwd: path.resolve(__dirname, '../..'),
    env: {
      ...process.env,
      CI: '1',
      EXPO_NO_TYPESCRIPT_SETUP: '1',
      EXPO_ROUTER_APP_ROOT: './e2e/photo-harness/app',
      EXPO_PUBLIC_API_URL: 'http://127.0.0.1:9',
    },
    url: 'http://127.0.0.1:8182',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

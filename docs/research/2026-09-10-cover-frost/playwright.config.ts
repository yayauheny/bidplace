import { defineConfig } from '../../../apps/mobile/node_modules/@playwright/test';

export default defineConfig({
  testDir: '../../../apps/mobile/e2e',
  testMatch: 'figma-cover-frost.spec.ts',
  outputDir: '/private/tmp/cover-frost-production-test',
  use: {
    baseURL: 'http://127.0.0.1:8097',
    viewport: { width: 390, height: 844 },
    screenshot: 'on',
  },
  workers: 1,
});

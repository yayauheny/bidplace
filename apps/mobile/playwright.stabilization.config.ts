import { defineConfig } from '@playwright/test';

const webPort = process.env.E2E_WEB_PORT ?? '8093';
const webBaseURL = `http://localhost:${webPort}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: [
    'figma-stabilization.spec.ts',
    'home-figma.spec.ts',
    'discovery-launch.spec.ts',
    'author-header-motion.spec.ts',
    'product-layout.spec.ts',
    'auth-layout.spec.ts',
    'figma-cover-frost.spec.ts',
  ],
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
});

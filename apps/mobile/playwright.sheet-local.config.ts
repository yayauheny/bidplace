import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e',
  testMatch: [
    'home-image-lifecycle.spec.ts',
    'sheet-live.spec.ts',
    'auth-layout.spec.ts',
    'auth-focus-restore.spec.ts',
    'search-overlay.spec.ts',
    'account-presentation.spec.ts',
    'author-achievement-revision.spec.ts',
  ],
  timeout: 60000,
  use: { baseURL: process.env.SHEET_TEST_URL || 'http://localhost:7899' },
  projects: [
    { name: 'webkit', use: { browserName: 'webkit' } },
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});

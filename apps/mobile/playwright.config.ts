import { defineConfig } from '@playwright/test';

const databaseUrl =
  'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e?schema=public';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:8081',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command:
        'node apps/mobile/e2e/prepare.mjs && pnpm --filter @bidplace/api build && node apps/api/dist/main.js',
      cwd: '../..',
      url: 'http://127.0.0.1:3001/api/health',
      env: {
        NODE_ENV: 'test',
        APP_ENV: 'local',
        API_PORT: '3001',
        CORS_ORIGIN: 'http://127.0.0.1:8081',
        DATABASE_URL: databaseUrl,
        E2E_DATABASE_URL: databaseUrl,
        JWT_SECRET: 'e2e-jwt-secret',
        TEST_EMAIL_FILE: 'apps/mobile/e2e/.email.jsonl',
      },
    },
    {
      command:
        'pnpm --filter @bidplace/mobile exec expo start --web --clear --port 8081',
      cwd: '../..',
      url: 'http://127.0.0.1:8081',
      env: { EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3001' },
    },
  ],
});

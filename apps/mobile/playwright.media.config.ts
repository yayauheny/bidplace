import { defineConfig } from '@playwright/test';
import config from './playwright.config';
export default defineConfig({
  ...config,
  testMatch: /work-media-lifecycle\.spec\.ts/,
  testIgnore: [],
  use: { ...config.use, actionTimeout: 10_000 },
  webServer: (Array.isArray(config.webServer) ? config.webServer : []).map(
    (server, index) =>
      index === 0
        ? {
            ...server,
            command: server.command.replace(
              'node apps/api/dist/main.js',
              'node apps/mobile/e2e/media-server.mjs',
            ),
          }
        : server,
  ),
});

import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['test/performance/*.spec.ts'], maxWorkers: 1, testTimeout: 240_000, disableConsoleIntercept: true } });

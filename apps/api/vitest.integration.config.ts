import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration/**/*.spec.ts'],
    testTimeout: 60000,
    // Each file migrates its own schema in the same local database. Prisma's
    // migrate lock is per database, so unbounded file parallelism makes later
    // beforeAll hooks exceed the existing 10s limit.
    maxWorkers: 4,
  },
});

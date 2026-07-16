import { afterEach, describe, expect, it } from 'vitest';

import { createIntegrationDatabaseContext } from './test-database';

const originalIntegrationDatabaseUrl = process.env.INTEGRATION_DATABASE_URL;

afterEach(() => {
  if (originalIntegrationDatabaseUrl === undefined) {
    delete process.env.INTEGRATION_DATABASE_URL;
    return;
  }

  process.env.INTEGRATION_DATABASE_URL = originalIntegrationDatabaseUrl;
});

describe('integration database bootstrap', () => {
  it('refuses to use a non-test database url', async () => {
    process.env.INTEGRATION_DATABASE_URL =
      'postgresql://auction:auction@127.0.0.1:5432/bidplace?schema=public';

    await expect(createIntegrationDatabaseContext()).rejects.toThrow(
      'Refusing to use non-test integration database "bidplace"',
    );
  });
});

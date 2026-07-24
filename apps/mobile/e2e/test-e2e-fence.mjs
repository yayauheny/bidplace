import assert from 'node:assert/strict';

import {
  assertDisposableDatabase,
  createMaintenanceDatabaseUrl,
} from './disposable-database.mjs';

function expectPass(databaseUrl, options) {
  assert.doesNotThrow(() => assertDisposableDatabase(databaseUrl, options));
}

function expectFail(databaseUrl, options, message) {
  assert.throws(
    () => assertDisposableDatabase(databaseUrl, options),
    (error) => error instanceof Error && error.message.includes(message),
  );
}

expectPass('postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e?schema=public', {
  nodeEnv: 'test',
});
expectPass('postgresql://auction:auction@db.internal.example:5432/bidplace_e2e?schema=public', {
  nodeEnv: 'test',
  allowNonLocalReset: true,
});

expectFail('', { nodeEnv: 'test' }, 'E2E_DATABASE_URL is required');
expectFail(
  'postgresql://auction:auction@127.0.0.1:5432/bidplace_prod?schema=public',
  { nodeEnv: 'test' },
  'bidplace_e2e',
);
expectFail(
  'postgresql://auction:auction@db.internal.example:5432/bidplace_e2e?schema=public',
  { nodeEnv: 'test' },
  'local host',
);
expectFail(
  'postgresql://auction:auction@127.0.0.1:5433/bidplace_e2e?schema=public',
  { nodeEnv: 'test' },
  'port 5432',
);
expectFail(
  'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e?schema=public',
  { nodeEnv: 'production' },
  'NODE_ENV must be test',
);

assert.equal(
  createMaintenanceDatabaseUrl(
    'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e?schema=public',
  ),
  'postgresql://auction:auction@127.0.0.1:5432/postgres?schema=public',
);

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertReadEnvironment,
  assertReadTarget,
  formatInventoryReport,
  parseDatabaseTarget,
  parseInventoryArgs,
  reportContainsSecrets,
} from './commerce-inventory.mjs';

describe('commerce-inventory read-only args', () => {
  it('accepts no flags', () => {
    assert.deepEqual(parseInventoryArgs([]), { mode: 'read-only' });
  });

  it('refuses --apply', () => {
    assert.throws(
      () => parseInventoryArgs(['--apply']),
      /read-only and refuses --apply/,
    );
  });

  it('refuses unknown flags', () => {
    assert.throws(() => parseInventoryArgs(['--confirm-target=x']), /Unknown flag/);
  });
});

describe('commerce-inventory environment guards', () => {
  it('requires explicit NODE_ENV and APP_ENV', () => {
    assert.throws(() => assertReadEnvironment({}), /NODE_ENV must be set/);
    assert.throws(
      () => assertReadEnvironment({ NODE_ENV: 'test' }),
      /APP_ENV must be set/,
    );
  });

  it('refuses unknown APP_ENV', () => {
    assert.throws(
      () =>
        assertReadEnvironment({ NODE_ENV: 'test', APP_ENV: 'preview' }),
      /Unknown APP_ENV "preview"/,
    );
  });

  it('refuses inconsistent production pairs', () => {
    assert.throws(
      () =>
        assertReadEnvironment({
          NODE_ENV: 'test',
          APP_ENV: 'production',
        }),
      /APP_ENV=production requires NODE_ENV=production/,
    );
    assert.throws(
      () =>
        assertReadEnvironment({
          NODE_ENV: 'production',
          APP_ENV: 'local',
        }),
      /NODE_ENV=production requires APP_ENV=production or APP_ENV=staging/,
    );
  });

  it('accepts test/local and production/production', () => {
    assert.deepEqual(
      assertReadEnvironment({ NODE_ENV: 'test', APP_ENV: 'local' }),
      { nodeEnv: 'test', appEnv: 'local' },
    );
    assert.deepEqual(
      assertReadEnvironment({
        NODE_ENV: 'production',
        APP_ENV: 'production',
      }),
      { nodeEnv: 'production', appEnv: 'production' },
    );
  });
});

describe('commerce-inventory target parsing', () => {
  it('extracts database name without returning the URL', () => {
    const target = parseDatabaseTarget(
      'postgresql://auction:auction@127.0.0.1:5432/bidplace_integration?schema=public',
    );
    assert.deepEqual(target, {
      hostname: '127.0.0.1',
      port: '5432',
      database: 'bidplace_integration',
      schema: 'public',
    });
    assert.equal(JSON.stringify(target).includes('auction:auction'), false);
    assert.equal(JSON.stringify(target).includes('://'), false);
  });

  it('does not echo a malformed URL', () => {
    assert.throws(
      () => parseDatabaseTarget('not-a-url'),
      /DATABASE_URL is not a valid URL/,
    );
  });

  it('refuses a mismatched connected database', () => {
    assert.throws(
      () =>
        assertReadTarget({
          fingerprint: parseDatabaseTarget(
            'postgresql://auction:auction@127.0.0.1:5432/bidplace_integration',
          ),
          connectedDatabase: 'bidplace',
        }),
      /does not match DATABASE_URL database "bidplace_integration"/,
    );
  });
});

describe('commerce-inventory report', () => {
  it('prints totals and decision ids without secrets', () => {
    const report = formatInventoryReport({
      environment: { nodeEnv: 'test', appEnv: 'local' },
      target: {
        hostname: '127.0.0.1',
        port: '5432',
        database: 'bidplace_integration',
        schema: 'public',
      },
      inventory: {
        listingTotal: 3,
        listingsByStatus: { LIVE: 1, SCHEDULED: 1, ENDED: 1 },
        bids: 0,
        ordersByStatus: {},
        listingsRequiringDecision: [
          { id: 'listing-live', status: 'LIVE', productId: 'product-live' },
        ],
      },
    });

    assert.match(report, /"mode": "read-only"/);
    assert.match(report, /"writes": false/);
    assert.match(report, /bidplace_integration/);
    assert.match(report, /listing-live/);
    assert.equal(reportContainsSecrets(report), false);
    assert.equal(report.includes('postgresql'), false);
    assert.equal(report.includes('auction:auction'), false);
  });
});

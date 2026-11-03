import assert from 'node:assert/strict';
import test from 'node:test';

import { assertDisposableTarget, bidLoadProblems } from './bid-load-check.mjs';

const consistent = {
  bids: [
    { status: 200, code: null },
    { status: 409, code: 'BID_TOO_LOW' },
    { status: 409, code: 'conflict' },
  ],
  tickStatus: 200,
  orders: 1,
  liveBids: 1,
  maxStoredAmount: 1500,
  listing: { bid_count: 1, current_price_minor: 1500 },
};

test('allows lost races and requires one order', () => {
  assert.deepEqual(bidLoadProblems(consistent), []);
});

test('fails a network error, a bad tick, a missing order, and a price mismatch', () => {
  assert.ok(bidLoadProblems({ ...consistent, bids: [{ status: 0, code: 'TimeoutError' }] }).includes('network'));
  assert.ok(
    bidLoadProblems({
      ...consistent,
      bids: [{ status: 500, code: 'internal_error' }],
    }).some((problem) => problem.startsWith('http 500')),
  );
  assert.ok(bidLoadProblems({ ...consistent, tickStatus: 500 }).includes('tick 500'));
  assert.ok(bidLoadProblems({ ...consistent, orders: 0 }).includes('orders 0'));
  assert.ok(bidLoadProblems({ ...consistent, orders: 2 }).includes('orders 2'));
  assert.ok(
    bidLoadProblems({
      ...consistent,
      listing: { bid_count: 2, current_price_minor: 1500 },
    }).includes('price bids counter'),
  );
});

test('refuses production and the default postgres port', () => {
  assert.throws(
    () =>
      assertDisposableTarget({
        baseUrl: 'https://bid.place',
        databaseUrl: 'postgres://127.0.0.1:55434/bidplace_integration',
      }),
    /non-loopback API/,
  );
  assert.throws(
    () =>
      assertDisposableTarget({
        baseUrl: 'http://127.0.0.1:3011',
        databaseUrl: 'postgres://127.0.0.1:5432/bidplace',
      }),
    /5432/,
  );
  assert.doesNotThrow(() =>
    assertDisposableTarget({
      baseUrl: 'http://127.0.0.1:3011',
      databaseUrl: 'postgres://127.0.0.1:55434/bidplace_integration',
    }),
  );
});

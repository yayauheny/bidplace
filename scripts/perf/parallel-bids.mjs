#!/usr/bin/env node
// Local-only load check. Refuses any database that is not the disposable
// bidplace_integration instance and any API that is not on loopback.

import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { Client } = require('pg');

const BUYERS = 50;
const PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$Hv01HhuWHyFmMIRCcxhH3w$9dvY3hECfoulYwe4VEPwWEJ4OHvYCCYbiw685vNdLZM';
const BUYER_PASSWORD = 'password123';
const TURNSTILE = 'XXXX.DUMMY.TOKEN.XXXX';
const REQUEST_TIMEOUT_MS = 15_000;

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function assertLocalTarget() {
  const baseUrl = process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3011';
  const databaseUrl = process.env.PERF_DATABASE_URL;
  const sellerEmail = process.env.PERF_SELLER_EMAIL;
  const sellerPassword = process.env.PERF_PASSWORD;
  if (!databaseUrl || !sellerEmail || !sellerPassword) {
    throw new Error(
      'PERF_DATABASE_URL, PERF_SELLER_EMAIL and PERF_PASSWORD are required',
    );
  }
  const api = new URL(baseUrl);
  const database = new URL(databaseUrl);
  if (!['127.0.0.1', 'localhost'].includes(api.hostname)) {
    throw new Error('Refusing a non-loopback API URL');
  }
  if (!['127.0.0.1', 'localhost'].includes(database.hostname)) {
    throw new Error('Refusing a non-loopback database URL');
  }
  if (database.port !== '55434' || database.pathname !== '/bidplace_integration') {
    throw new Error(
      'Refusing a database other than 127.0.0.1:55434/bidplace_integration',
    );
  }
  return { baseUrl: api.origin, databaseUrl, sellerEmail, sellerPassword };
}

function percentile(sorted, ratio) {
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(ratio * sorted.length) - 1),
  );
  return sorted[index];
}

class Jar {
  constructor() {
    this.cookies = new Map();
  }

  store(response) {
    for (const header of response.headers.getSetCookie()) {
      const pair = header.split(';', 1)[0] ?? '';
      const separator = pair.indexOf('=');
      if (separator > 0) {
        this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
      }
    }
  }

  header() {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}

async function request(baseUrl, jar, path, body, forwardedFor) {
  const started = performance.now();
  const response = await fetch(new URL(`/api${path}`, baseUrl), {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      cookie: jar.header(),
      origin: 'http://127.0.0.1:3011',
      'x-bidplace-request': '1',
      'x-forwarded-for': forwardedFor,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  jar.store(response);
  const elapsedMs = performance.now() - started;
  return { response, elapsedMs };
}

async function main() {
  const target = assertLocalTarget();
  const db = new Client({ connectionString: target.databaseUrl });
  await db.connect();
  const buyerIds = [];
  let listingId = null;
  try {
    const product = await db.query(
      `SELECT p.id
       FROM products p
       JOIN seller_profiles s ON s.id = p.seller_profile_id
       JOIN users u ON u.id = s.user_id
       WHERE u.email = $1
         AND p.status = 'APPROVED'
         AND p.deleted_at IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM listings l
           WHERE l.product_id = p.id AND l.status IN ('SCHEDULED', 'LIVE')
         )
       LIMIT 1`,
      [target.sellerEmail],
    );
    if (!product.rows[0]) throw new Error('Seller has no free approved work');
    const productId = product.rows[0].id;

    for (let index = 0; index < BUYERS; index += 1) {
      const created = await db.query(
        `INSERT INTO users (
           id, email, password_hash, display_name, email_verified_at, contact_phone,
           status, role, created_at, updated_at
         ) VALUES (
           $1::uuid, $2, $3, $4, now(), $5, 'active', 'user', now(), now()
         ) RETURNING id`,
        [
          randomUUID(),
          `perf-buyer-${index}@perf.invalid`,
          PASSWORD_HASH,
          `perf ${index}`,
          `+37529113${String(index).padStart(4, '0')}`,
        ],
      );
      buyerIds.push(created.rows[0].id);
    }

    const seller = new Jar();
    const sellerLogin = await request(
      target.baseUrl,
      seller,
      '/auth/login',
      {
        email: target.sellerEmail,
        password: target.sellerPassword,
      },
      '198.51.100.10',
    );
    if (sellerLogin.response.status !== 201) {
      throw new Error(`Seller login failed with HTTP ${sellerLogin.response.status}`);
    }
    const createdListing = await request(
      target.baseUrl,
      seller,
      `/works/${productId}/listings`,
      {
        type: 'AUCTION',
        currency: 'BYN',
        startPriceMinor: 1_000,
        startsAt: new Date(Date.now() - 1_000).toISOString(),
        endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      '198.51.100.10',
    );
    if (createdListing.response.status !== 201) {
      throw new Error(`Listing create failed with HTTP ${createdListing.response.status}`);
    }
    listingId = (await createdListing.response.json()).id;

    const jars = [];
    for (let index = 0; index < BUYERS; index += 1) {
      const jar = new Jar();
      const login = await request(
        target.baseUrl,
        jar,
        '/auth/login',
        {
          email: `perf-buyer-${index}@perf.invalid`,
          password: BUYER_PASSWORD,
        },
        `198.51.100.${20 + index}`,
      );
      if (login.response.status !== 201) {
        throw new Error(`Buyer login failed with HTTP ${login.response.status}`);
      }
      jars.push(jar);
    }

    const bids = await Promise.all(
      jars.map(async (jar, index) => {
        try {
          const result = await request(
            target.baseUrl,
            jar,
            `/listings/${listingId}/bids`,
            {
              amountMinor: 1_000 + index * 500,
              idempotencyKey: `perf-bid-${String(index).padStart(2, '0')}`,
              turnstileToken: TURNSTILE,
            },
            `198.51.100.${20 + index}`,
          );
          let code = null;
          if (result.response.status !== 200) {
            const body = await result.response.json().catch(() => null);
            code = body && typeof body.code === 'string' ? body.code : null;
          }
          return {
            status: result.response.status,
            code,
            elapsedMs: result.elapsedMs,
          };
        } catch (error) {
          return {
            status: 0,
            code: error instanceof Error ? error.name : 'Error',
            elapsedMs: REQUEST_TIMEOUT_MS,
          };
        }
      }),
    );

    const stored = await db.query(
      `SELECT COUNT(*)::int AS rows,
              COUNT(*) FILTER (WHERE voided_at IS NULL)::int AS live,
              COALESCE(MAX(amount_minor) FILTER (WHERE voided_at IS NULL), 0)::int AS max_amount
       FROM bids WHERE listing_id = $1`,
      [listingId],
    );
    const listing = await db.query(
      `SELECT status, current_price_minor, bid_count
       FROM listings WHERE id = $1`,
      [listingId],
    );
    const durations = bids.map((bid) => bid.elapsedMs).sort((a, b) => a - b);
    const codes = {};
    for (const bid of bids) {
      const key = `${bid.status}${bid.code ? ` ${bid.code}` : ''}`;
      codes[key] = (codes[key] ?? 0) + 1;
    }
    const accepted = bids.filter((bid) => bid.status === 200).length;
    const serverErrors = bids.filter((bid) => bid.status >= 500).length;

    await db.query(
      `UPDATE listings
       SET ends_at = clock_timestamp() - interval '1 second'
       WHERE id = $1`,
      [listingId],
    );
    const tick = await fetch(new URL('/api/internal/tick', target.baseUrl), {
      method: 'POST',
      headers: {
        'x-internal-tick': process.env.PERF_TICK_SECRET ?? '',
        origin: 'http://127.0.0.1:3011',
        'x-bidplace-request': '1',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const orders = await db.query(
      `SELECT COUNT(*)::int AS orders
       FROM orders WHERE listing_id = $1`,
      [listingId],
    );

    console.log(
      JSON.stringify({
        phase: 'bids',
        http: codes,
        accepted,
        serverErrors,
        bidRows: stored.rows[0].rows,
        liveBids: stored.rows[0].live,
        maxStoredAmount: stored.rows[0].max_amount,
        listing: listing.rows[0],
        p50Ms: Math.round(percentile(durations, 0.5)),
        p95Ms: Math.round(percentile(durations, 0.95)),
        maxMs: Math.round(durations.at(-1) ?? 0),
        closePhase: {
          tickStatus: tick.status,
          orders: orders.rows[0].orders,
        },
      }),
    );
    if (serverErrors > 0 || accepted === 0) process.exitCode = 1;
    const row = listing.rows[0];
    if (
      row.bid_count !== stored.rows[0].live ||
      row.current_price_minor !== stored.rows[0].max_amount
    ) {
      process.exitCode = 1;
    }
  } finally {
    if (listingId || buyerIds.length > 0) {
      await db.query(
        `DELETE FROM notification_outbox
         WHERE ($1::uuid IS NOT NULL AND payload->>'listingId' = $1::text)
            OR user_id = ANY($2::uuid[])`,
        [listingId, buyerIds],
      );
      await db.query(`DELETE FROM orders WHERE listing_id = $1`, [listingId]);
      await db.query(`DELETE FROM bids WHERE listing_id = $1 OR bidder_user_id = ANY($2::uuid[])`, [
        listingId,
        buyerIds,
      ]);
      if (listingId) {
        await db.query(`DELETE FROM auction_rules WHERE listing_id = $1`, [listingId]);
        await db.query(`DELETE FROM listings WHERE id = $1`, [listingId]);
      }
      await db.query(`DELETE FROM auth_sessions WHERE sess::text LIKE ANY($1::text[])`, [
        buyerIds.map((id) => `%${id}%`),
      ]);
      await db.query(`DELETE FROM purchase_holds WHERE user_id = ANY($1::uuid[])`, [buyerIds]);
      await db.query(`DELETE FROM fraud_signals WHERE user_id = ANY($1::uuid[])`, [buyerIds]);
      await db.query(`DELETE FROM rate_limit_counters WHERE key LIKE 'commerce:bid:%'`);
      await db.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [buyerIds]);
    }
    await db.end();
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : 'parallel bids failed');
});

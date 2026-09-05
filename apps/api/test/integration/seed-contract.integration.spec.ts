import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import type { PrismaClient } from '@bidplace/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;
const repositoryRoot = resolve(__dirname, '../../../..');
const seedPath = resolve(repositoryRoot, 'packages/database/prisma/seed.js');

function runSeed(options: { nodeEnv: string; appEnv: string }): void {
  execFileSync(process.execPath, [seedPath], {
    cwd: resolve(repositoryRoot, 'packages/database'),
    env: {
      ...process.env,
      NODE_ENV: options.nodeEnv,
      APP_ENV: options.appEnv,
      DATABASE_URL: context.databaseUrl,
      ALLOW_DESTRUCTIVE_DEMO_SEED: 'true',
      SEED_ADMIN_EMAIL: 'seed-contract-admin@bidplace.test',
      SEED_ADMIN_PASSWORD: 'seed-contract-fixture-password',
    },
    stdio: 'pipe',
  });
}

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});

afterAll(async () => context?.cleanup());

describe('demo seed executable contract', () => {
  it('creates internally consistent local/test bid and Order fixtures', async () => {
    runSeed({ nodeEnv: 'test', appEnv: 'local' });

    const [live, ended, endedBids, orders, buyer] = await Promise.all([
      prisma.listing.findFirst({
        where: { status: 'LIVE' },
        include: { bids: true },
      }),
      prisma.listing.findFirst({
        where: { status: 'ENDED', product: { publicId: 'seedEnded03' } },
        include: { bids: true },
      }),
      prisma.bid.findMany({
        where: {
          listing: {
            status: 'ENDED',
            product: { publicId: 'seedEnded03' },
          },
        },
        include: { bidderUser: true },
      }),
      prisma.order.findMany({
        include: { sourceBid: true, buyer: true },
      }),
      prisma.user.findUnique({
        where: { email: 'buyer@bidplace.test' },
      }),
    ]);

    expect(await prisma.bid.count()).toBe(2);
    expect(live?.currentPrice.toNumber()).toBe(75);
    expect(live?.bidCount).toBe(1);
    expect(ended?.currentPrice.toNumber()).toBe(120);
    expect(ended?.bidCount).toBe(1);
    expect(endedBids).toHaveLength(1);
    expect(endedBids[0]?.bidderUserId).toBe(buyer?.id);
    expect(orders).toHaveLength(1);
    expect(orders[0]?.buyerId).toBe(buyer?.id);
    expect(orders[0]?.sourceBidId).toBe(endedBids[0]?.id);
    expect(orders[0]?.finalAmount.toNumber()).toBe(120);
  });

  it.each([
    { nodeEnv: 'production', appEnv: 'production' },
    { nodeEnv: 'test', appEnv: 'production' },
    { nodeEnv: 'development', appEnv: 'production' },
  ])(
    'denies demo bids for production-like profile $nodeEnv/$appEnv before any write',
    ({ nodeEnv, appEnv }) => {
      expect(() => runSeed({ nodeEnv, appEnv })).toThrow(
        'Refusing demo-bid seed outside an explicitly allowed local/test profile',
      );
    },
  );

  it('keeps the seeded database unchanged after production-like denial', async () => {
    const before = {
      bids: await prisma.bid.count(),
      orders: await prisma.order.count(),
    };

    expect(() =>
      runSeed({ nodeEnv: 'production', appEnv: 'production' }),
    ).toThrow();

    expect(await prisma.bid.count()).toBe(before.bids);
    expect(await prisma.order.count()).toBe(before.orders);
  });
});

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiErrorCode } from '@bidplace/contracts';
import { Prisma, type PrismaClient } from '@bidplace/database';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import { fixturePasswordHash } from './permission-fixtures';
import {
  createOrderFixture,
  resetOrderFixture,
} from './order-fixtures';
import {
  createHttpTestApp,
  HttpTestClient,
  responseJson,
  type HttpTestApp,
} from './http-test-app';

let database: IntegrationDatabaseContext;
let http: HttpTestApp;
let prisma: PrismaClient;

beforeAll(async () => {
  database = await createIntegrationDatabaseContext();
  prisma = database.prisma;
  http = await createHttpTestApp(database.databaseUrl);
});

afterEach(async () => {
  await resetOrderFixture(prisma);
});

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

async function createAdmin(): Promise<{
  id: string;
  email: string;
  password: string;
}> {
  const user = await prisma.user.create({
    data: {
      email: `admin.${Date.now()}@inbox-http.test`,
      passwordHash: fixturePasswordHash,
      displayName: 'Inbox HTTP admin',
      role: 'admin',
    },
    select: { id: true, email: true },
  });

  return { ...user, password: 'password123' };
}

async function login(
  client: HttpTestClient,
  user: { email: string; password: string },
): Promise<void> {
  const response = await client.post('/auth/login', {
    email: user.email,
    password: user.password,
  });
  expect(response.status).toBe(201);
}

describe('seller Order inbox HTTP auth', () => {
  it('rejects a guest GET /api/orders with 401', async () => {
    const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    const response = await client.get('/orders');

    expect(response.status).toBe(401);
    expect(await responseJson(response)).toEqual(
      expect.objectContaining({
        status: 401,
        code: ApiErrorCode.UNAUTHORIZED,
      }),
    );
  });

  it('rejects an admin GET /api/orders with 403', async () => {
    const admin = await createAdmin();
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.80.2',
    );

    await login(client, admin);
    const response = await client.get('/orders');

    expect(response.status).toBe(403);
    expect(await responseJson(response)).toEqual(
      expect.objectContaining({
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
        message: 'Seller access required',
      }),
    );
  });

  it('returns an approved seller active and cancelled sales in stable order', async () => {
    const fixture = await createOrderFixture(prisma);
    await prisma.order.update({
      where: { id: fixture.order.id },
      data: { createdAt: new Date('2026-08-05T10:00:00.000Z') },
    });
    const cancelledBid = await prisma.bid.create({
      data: {
        listingId: fixture.listing.id,
        bidderUserId: fixture.nextRanked.id,
        idempotencyKey: `cancelled-${fixture.order.publicId}`,
        amount: new Prisma.Decimal(150),
      },
      select: { id: true },
    });
    const cancelled = await prisma.order.create({
      data: {
        publicId: 'cancelled01',
        listingId: fixture.listing.id,
        sellerId: fixture.seller.id,
        buyerId: fixture.nextRanked.id,
        sourceBidId: cancelledBid.id,
        finalAmount: new Prisma.Decimal(150),
        contactDueAt: new Date('2026-08-07T10:00:00.000Z'),
        sellerHandoffType: 'TELEGRAM',
        sellerHandoffValue: fixture.sellerContact,
        buyerEmailAtClose: fixture.nextRanked.email,
        handoffInitiator: 'BUYER_CONTACTS_SELLER',
        status: 'CANCELLED',
        cancellationReason: 'ADMIN_CANCELLED',
        snapshotTitle: 'Cancelled HTTP sale',
        snapshotCurrency: 'BYN',
        snapshotProductPublicId: 'product0011',
        createdAt: new Date('2026-08-06T10:00:00.000Z'),
      },
      select: { publicId: true },
    });
    const seller = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(seller, { ...fixture.seller, password: 'password123' });

    const list = await seller.get('/orders?limit=20&page=1');

    expect(list.status).toBe(200);
    expect(await responseJson(list)).toMatchObject({
      pagination: { page: 1, limit: 20, total: 2 },
      orders: [
        {
          order: {
            publicId: cancelled.publicId,
            status: 'CANCELLED',
            cancellationReason: 'ADMIN_CANCELLED',
          },
          buyerEmailAtClose: fixture.nextRanked.email,
        },
        {
          order: { publicId: fixture.order.publicId, status: 'PENDING_CONTACT' },
          buyerEmailAtClose: fixture.winner.email,
        },
      ],
    });
    expect((await seller.get(`/orders/${cancelled.publicId}`)).status).toBe(200);

    const buyer = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(buyer, { ...fixture.winner, password: 'password123' });
    expect((await buyer.get('/orders')).status).toBe(403);
    expect((await buyer.get(`/orders/${cancelled.publicId}`)).status).toBe(403);
  });
});

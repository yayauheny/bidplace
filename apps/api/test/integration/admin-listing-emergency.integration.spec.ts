import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createPermissionFixture,
  fixturePasswordHash,
  resetPermissionFixture,
} from './permission-fixtures';
import {
  createHttpTestApp,
  HttpTestClient,
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

afterEach(async () => resetPermissionFixture(prisma));

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

async function createAdmin(): Promise<{
  email: string;
  password: string;
}> {
  const user = await prisma.user.create({
    data: {
      email: `admin.listing.${Date.now()}@wave3.test`,
      passwordHash: fixturePasswordHash,
      displayName: 'Listing admin',
      role: 'admin',
    },
    select: { email: true },
  });

  return { ...user, password: 'password123' };
}

async function loginAdmin(client: HttpTestClient, admin: { email: string; password: string }) {
  const response = await client.post('/auth/login', {
    email: admin.email,
    password: admin.password,
  });
  expect(response.status).toBe(201);
}

describe('admin listing emergency cancel HTTP transport', () => {
  it('cancels scheduled and live listings and rejects ended listings', async () => {
    const fixture = await createPermissionFixture(prisma);
    const admin = await createAdmin();
    const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    await loginAdmin(client, admin);

    await prisma.listing.update({
      where: { id: fixture.approvedListingId },
      data: { status: 'SCHEDULED' },
    });

    const scheduledCancel = await client.post(
      `/admin/listings/${fixture.approvedListingId}/emergency-cancel`,
      { reason: 'Prohibited item' },
    );
    expect(scheduledCancel.status).toBe(201);
    expect(await scheduledCancel.json()).toEqual({ ok: true });

    const scheduledListing = await prisma.listing.findUniqueOrThrow({
      where: { id: fixture.approvedListingId },
    });
    expect(scheduledListing.status).toBe('CANCELLED');

    const repeatCancel = await client.post(
      `/admin/listings/${fixture.approvedListingId}/emergency-cancel`,
      { reason: 'Repeat' },
    );
    expect(repeatCancel.status).toBe(201);

    const liveListing = await prisma.listing.create({
      data: {
        productId: fixture.approvedProductId,
        status: 'LIVE',
        startsAt: new Date(Date.now() - 3_600_000),
        originalEndsAt: new Date(Date.now() + 3_600_000),
        endsAt: new Date(Date.now() + 3_600_000),
        currentPrice: 10,
        auctionRules: { create: { startPrice: 10 } },
      },
      select: { id: true },
    });

    const liveCancel = await client.post(
      `/admin/listings/${liveListing.id}/emergency-cancel`,
      { reason: 'Live abuse' },
    );
    expect(liveCancel.status).toBe(201);

    const endedListing = await prisma.listing.create({
      data: {
        productId: fixture.approvedProductId,
        status: 'ENDED',
        startsAt: new Date(Date.now() - 7_200_000),
        originalEndsAt: new Date(Date.now() - 3_600_000),
        endsAt: new Date(Date.now() - 3_600_000),
        currentPrice: 10,
        auctionRules: { create: { startPrice: 10 } },
      },
      select: { id: true },
    });

    const endedCancel = await client.post(
      `/admin/listings/${endedListing.id}/emergency-cancel`,
      { reason: 'Should fail' },
    );
    expect(endedCancel.status).toBe(409);

    const audit = await prisma.auditEvent.findFirst({
      where: {
        targetType: 'LISTING',
        targetId: fixture.approvedListingId,
        newStatus: 'CANCELLED',
      },
    });
    expect(audit?.reason).toBe('Prohibited item');
  });
});

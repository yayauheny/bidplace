import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createPermissionFixture,
  permissionImage,
  permissionState,
  resetPermissionFixture,
  type PermissionFixture,
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

function createClients(fixture: PermissionFixture) {
  const clients = {
    guest: new HttpTestClient(http.baseUrl, 'http://localhost:8081'),
    buyer: new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.0.2',
    ),
    pending: new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.0.3',
    ),
    changes: new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.0.4',
    ),
    suspended: new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.0.5',
    ),
    approved: new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.0.6',
    ),
    otherApproved: new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.0.7',
    ),
  };

  return login(clients.buyer, fixture.buyer).then(async () => {
    await login(clients.pending, fixture.sellers.pending);
    await login(clients.changes, fixture.sellers.changes);
    await login(clients.suspended, fixture.sellers.suspended);
    await login(clients.approved, fixture.sellers.approved);
    await login(clients.otherApproved, fixture.sellers.otherApproved);
    return clients;
  });
}

function productInput(title: string) {
  return {
    categoryId: undefined,
    title,
    story: 'A product submitted through the Wave 3 permission test.',
  };
}

function sellerUpdateForm(fullName: string): FormData {
  const form = new FormData();
  form.set('fullName', fullName);
  return form;
}

function imageForm(): FormData {
  const form = new FormData();
  form.set(
    'images',
    new Blob([permissionImage], { type: 'image/png' }),
    'wave3.png',
  );
  return form;
}

async function expectUnchanged(
  before: unknown,
  response: Response,
  status: number,
): Promise<void> {
  expect(response.status).toBe(status);
  expect(await permissionState(prisma)).toEqual(before);
}

describe('seller permission boundaries over HTTP and PostgreSQL', () => {
  it('allows Product writes only to the approved owner and denies every other actor', async () => {
    const fixture = await createPermissionFixture(prisma);
    const clients = await createClients(fixture);
    const input = productInput('HTTP permission product');

    const guestBefore = await permissionState(prisma);
    await expectUnchanged(
      guestBefore,
      await clients.guest.post('/products', input),
      401,
    );

    const buyerBefore = await permissionState(prisma);
    await expectUnchanged(
      buyerBefore,
      await clients.buyer.post('/products', input),
      404,
    );

    for (const [name, client] of [
      ['pending', clients.pending],
      ['changes', clients.changes],
      ['suspended', clients.suspended],
    ] as const) {
      const before = await permissionState(prisma);
      await expectUnchanged(before, await client.post('/products', input), 403);
      expect(name).toMatch(/pending|changes|suspended/);
    }

    const createResponse = await clients.approved.post('/products', input);
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as {
      product: { id: string };
    };

    const updateResponse = await clients.approved.patch(
      `/products/${created.product.id}`,
      { title: 'Updated by approved owner' },
    );
    expect(updateResponse.status).toBe(200);

    const otherBefore = await permissionState(prisma);
    await expectUnchanged(
      otherBefore,
      await clients.otherApproved.patch(`/products/${created.product.id}`, {
        title: 'Cross-owner mutation',
      }),
      403,
    );

    for (const client of [
      clients.pending,
      clients.changes,
      clients.suspended,
    ]) {
      const before = await permissionState(prisma);
      await expectUnchanged(
        before,
        await client.patch(`/products/${fixture.sellers.approved.productId}`, {
          title: 'Status-denied mutation',
        }),
        403,
      );
    }
  });

  it('protects Product submit, Listing create/change and image mutations through the same HTTP boundary', async () => {
    const fixture = await createPermissionFixture(prisma);
    const clients = await createClients(fixture);
    const listingInput = {
      startsAt: '2026-08-05T14:00:00.000Z',
      endsAt: '2026-08-05T15:00:00.000Z',
      startPrice: 10,
    };

    for (const client of [clients.guest, clients.buyer]) {
      const before = await permissionState(prisma);
      const response = await client.post(
        `/products/${fixture.approvedDraftProductId}/submit`,
        undefined,
      );
      await expectUnchanged(
        before,
        response,
        client === clients.guest ? 401 : 403,
      );
    }

    for (const [client, productId] of [
      [clients.pending, fixture.sellers.pending.productId],
      [clients.changes, fixture.sellers.changes.productId],
      [clients.suspended, fixture.sellers.suspended.productId],
      [clients.otherApproved, fixture.approvedDraftProductId],
    ] as const) {
      const before = await permissionState(prisma);
      await expectUnchanged(
        before,
        await client.post(`/products/${productId}/submit`, undefined),
        403,
      );
    }

    for (const [client, productId] of [
      [clients.guest, fixture.approvedProductId],
      [clients.buyer, fixture.approvedProductId],
      [clients.pending, fixture.sellers.pending.productId],
      [clients.changes, fixture.sellers.changes.productId],
      [clients.suspended, fixture.sellers.suspended.productId],
      [clients.otherApproved, fixture.approvedProductId],
    ] as const) {
      const before = await permissionState(prisma);
      const response = await client.post(
        `/products/${productId}/listings`,
        listingInput,
      );
      await expectUnchanged(
        before,
        response,
        client === clients.guest ? 401 : 403,
      );
    }

    const createListingResponse = await clients.approved.post(
      `/products/${fixture.approvedProductId}/listings`,
      listingInput,
    );
    expect(createListingResponse.status).toBe(201);
    const createdListing = (await createListingResponse.json()) as {
      listing: { id: string };
    };
    expect(
      (
        await clients.approved.patch(`/listings/${createdListing.listing.id}`, {
          action: 'SCHEDULE',
        })
      ).status,
    ).toBe(200);

    const crossOwnerListingBefore = await permissionState(prisma);
    await expectUnchanged(
      crossOwnerListingBefore,
      await clients.otherApproved.patch(
        `/listings/${fixture.approvedListingId}`,
        {
          action: 'CANCEL',
        },
      ),
      403,
    );

    for (const [client, expectedStatus] of [
      [clients.buyer, 403],
      [clients.pending, 403],
      [clients.changes, 403],
      [clients.suspended, 403],
      [clients.otherApproved, 403],
    ] as const) {
      const before = await permissionState(prisma);
      await expectUnchanged(
        before,
        await client.patch(`/listings/${fixture.approvedListingId}`, {
          action: 'CANCEL',
        }),
        expectedStatus,
      );
    }

    for (const [client, productId] of [
      [clients.guest, fixture.approvedDraftProductId],
      [clients.buyer, fixture.approvedDraftProductId],
      [clients.pending, fixture.sellers.pending.productId],
      [clients.changes, fixture.sellers.changes.productId],
      [clients.suspended, fixture.sellers.suspended.productId],
      [clients.otherApproved, fixture.approvedDraftProductId],
    ] as const) {
      const before = await permissionState(prisma);
      await expectUnchanged(
        before,
        await client.post(`/products/${productId}/images`, imageForm()),
        client === clients.guest ? 401 : 403,
      );
    }

    const addImageResponse = await clients.approved.post(
      `/products/${fixture.approvedDraftProductId}/images`,
      imageForm(),
    );
    expect(addImageResponse.status).toBe(201);
    const imageRows = await prisma.productImage.findMany({
      where: { productId: fixture.approvedDraftProductId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });
    expect(imageRows).toHaveLength(3);

    for (const [client, productId] of [
      [clients.guest, fixture.approvedDraftProductId],
      [clients.buyer, fixture.approvedDraftProductId],
      [clients.pending, fixture.sellers.pending.productId],
      [clients.changes, fixture.sellers.changes.productId],
      [clients.suspended, fixture.sellers.suspended.productId],
      [clients.otherApproved, fixture.approvedDraftProductId],
    ] as const) {
      const before = await permissionState(prisma);
      await expectUnchanged(
        before,
        await client.patch(`/products/${productId}/images/order`, {
          imageIds: imageRows.map((image) => image.id).reverse(),
        }),
        client === clients.guest ? 401 : 403,
      );
    }

    expect(
      (
        await clients.approved.patch(
          `/products/${fixture.approvedDraftProductId}/images/order`,
          {
            imageIds: imageRows.map((image) => image.id).reverse(),
          },
        )
      ).status,
    ).toBe(200);

    for (const [client, expectedStatus] of [
      [clients.guest, 401],
      [clients.buyer, 403],
      [clients.pending, 403],
      [clients.changes, 403],
      [clients.suspended, 403],
      [clients.otherApproved, 403],
    ] as const) {
      const before = await permissionState(prisma);
      await expectUnchanged(
        before,
        await client.delete(
          `/products/${fixture.approvedDraftProductId}/images/${imageRows[0]!.id}`,
        ),
        expectedStatus,
      );
    }

    expect(
      (
        await clients.approved.delete(
          `/products/${fixture.approvedDraftProductId}/images/${imageRows[0]!.id}`,
        )
      ).status,
    ).toBe(200);

    const submitResponse = await clients.approved.post(
      `/products/${fixture.approvedDraftProductId}/submit`,
      undefined,
    );
    expect(submitResponse.status).toBe(201);
    expect(
      (
        await prisma.product.findUniqueOrThrow({
          where: { id: fixture.approvedDraftProductId },
        })
      ).status,
    ).toBe('PENDING_REVIEW');
    expect(
      await prisma.auditEvent.count({
        where: {
          targetType: 'PRODUCT',
          targetId: fixture.approvedDraftProductId,
        },
      }),
    ).toBe(1);
  });

  it('allows SellerProfile correction only in CHANGES_REQUESTED and denies other statuses', async () => {
    const fixture = await createPermissionFixture(prisma);
    const clients = await createClients(fixture);

    const guestBefore = await permissionState(prisma);
    await expectUnchanged(
      guestBefore,
      await clients.guest.patch('/seller/profile', sellerUpdateForm('Guest')),
      401,
    );

    const buyerBefore = await permissionState(prisma);
    await expectUnchanged(
      buyerBefore,
      await clients.buyer.patch('/seller/profile', sellerUpdateForm('Buyer')),
      404,
    );

    for (const [key, client] of [
      ['pending', clients.pending],
      ['suspended', clients.suspended],
      ['approved', clients.approved],
      ['otherApproved', clients.otherApproved],
    ] as const) {
      const before = await permissionState(prisma);
      await expectUnchanged(
        before,
        await client.patch(
          '/seller/profile',
          sellerUpdateForm(`Denied ${key}`),
        ),
        403,
      );
    }

    const response = await clients.changes.patch(
      '/seller/profile',
      sellerUpdateForm('Normalized correction name'),
    );
    expect(response.status).toBe(200);
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: fixture.sellers.changes.profileId },
        })
      ).fullName,
    ).toBe('Normalized correction name');
  });
});

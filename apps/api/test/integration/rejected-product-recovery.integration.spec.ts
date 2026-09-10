import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@bidplace/database';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createPermissionFixture,
  fixturePasswordHash,
  permissionImage,
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

async function createAdmin(suffix: string) {
  const user = await prisma.user.create({
    data: {
      email: `admin.${suffix}@wave3.test`,
      passwordHash: fixturePasswordHash,
      displayName: 'Rejected recovery admin',
      role: 'admin',
    },
    select: { id: true, email: true },
  });
  return { ...user, password: 'password123' };
}

function createClients() {
  const clients = {
    approved: new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.2',
    ),
    otherApproved: new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.3',
    ),
    pending: new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.4',
    ),
    admin: new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.5',
    ),
    guest: new HttpTestClient(http.baseUrl, 'http://localhost:8081'),
  };
  return clients;
}

async function createRejectedProduct(
  fixture: PermissionFixture,
  actorUserId: string,
) {
  const product = await prisma.product.create({
    data: {
      publicId: `rjprod${randomUUID().replace(/-/g, '').slice(0, 5)}`,
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      title: 'Rejected recovery work',
      story: 'A rejected item that should be recoverable',
      uniqueness: 'One',
      provenance: 'Studio',
      city: 'Minsk',
      deliveryInfo: 'Pickup',
      status: 'REJECTED',
      images: {
        create: {
          position: 0,
          mimeType: 'image/png',
          byteLength: permissionImage.byteLength,
          data: permissionImage,
          checksum: '9'.repeat(64),
        },
      },
    },
    select: {
      id: true,
      publicId: true,
      images: { select: { id: true } },
    },
  });
  const revision = await prisma.productRevision.create({
    data: {
      productId: product.id,
      version: 1,
      status: 'REJECTED',
      categoryId: fixture.categoryId,
      title: 'Rejected recovery work',
      story: 'A rejected item that should be recoverable',
      uniqueness: 'One',
      provenance: 'Studio',
      city: 'Minsk',
      deliveryInfo: 'Pickup',
      images: {
        create: {
          imageId: product.images[0]!.id,
          position: 0,
        },
      },
    },
  });
  await prisma.product.update({
    where: { id: product.id },
    data: { editingRevisionId: revision.id },
  });
  await prisma.auditEvent.create({
    data: {
      actorUserId,
      targetType: 'PRODUCT',
      targetId: product.id,
      oldStatus: 'PENDING_REVIEW',
      newStatus: 'REJECTED',
      reason: 'Provenance could not be confirmed',
    },
  });
  return product;
}

describe('rejected Product recovery over HTTP and PostgreSQL', () => {
  it('lets the approved owner edit and resubmit the same private Product', async () => {
    const fixture = await createPermissionFixture(prisma);
    const admin = await createAdmin(randomUUID().replace(/-/g, '').slice(0, 8));
    const clients = createClients();
    await login(clients.approved, fixture.sellers.approved);
    await login(clients.otherApproved, fixture.sellers.otherApproved);
    await login(clients.pending, fixture.sellers.pending);
    await login(clients.admin, admin);

    const rejected = await createRejectedProduct(fixture, admin.id);
    const productCountBefore = await prisma.product.count();
    const listingCountBefore = await prisma.listing.count();

    expect(
      (await clients.guest.get(`/products/${rejected.publicId}`)).status,
    ).toBe(404);

    const ownerDetail = await clients.approved.get(
      `/seller/products/${rejected.id}`,
    );
    expect(ownerDetail.status).toBe(200);
    const ownerBody = (await ownerDetail.json()) as {
      product: { id: string; status: string; title: string };
      lastModerationReason: string | null;
    };
    expect(ownerBody.product.id).toBe(rejected.id);
    expect(ownerBody.product.status).toBe('REJECTED');
    expect(ownerBody.lastModerationReason).toBe(
      'Provenance could not be confirmed',
    );

    expect(
      (await clients.otherApproved.get(`/seller/products/${rejected.id}`))
        .status,
    ).toBe(404);
    expect(
      (await clients.admin.patch(`/products/${rejected.id}`, {
        title: 'Admin rewrite',
      })).status,
    ).toBe(403);
    expect(
      (
        await clients.pending.patch(`/products/${rejected.id}`, {
          title: 'Unapproved rewrite',
        })
      ).status,
    ).toBe(403);

    const editResponse = await clients.approved.patch(
      `/products/${rejected.id}`,
      { title: 'Corrected recovery work' },
    );
    expect(editResponse.status).toBe(200);
    const edited = (await editResponse.json()) as {
      product: { id: string; status: string; title: string };
    };
    expect(edited.product.id).toBe(rejected.id);
    expect(edited.product.status).toBe('REJECTED');
    expect(edited.product.title).toBe('Corrected recovery work');

    expect(
      (await clients.guest.get(`/products/${rejected.publicId}`)).status,
    ).toBe(404);
    expect(await prisma.product.count()).toBe(productCountBefore);
    expect(await prisma.listing.count()).toBe(listingCountBefore);

    const startsAt = new Date(Date.now() + 3_600_000);
    expect(
      (
        await clients.approved.post(`/products/${rejected.id}/listings`, {
          startsAt: startsAt.toISOString(),
          endsAt: new Date(startsAt.getTime() + 3_600_000).toISOString(),
          startPrice: 10,
        })
      ).status,
    ).toBe(404);

    const submitResponse = await clients.approved.post(
      `/products/${rejected.id}/submit`,
      undefined,
    );
    expect(submitResponse.status).toBe(201);
    const submitted = (await submitResponse.json()) as {
      product: { id: string; status: string; publishedAt: string | null };
    };
    expect(submitted.product.id).toBe(rejected.id);
    expect(submitted.product.status).toBe('PENDING_REVIEW');
    expect(submitted.product.publishedAt).toBeNull();

    expect(
      (await clients.guest.get(`/products/${rejected.publicId}`)).status,
    ).toBe(404);
    expect(await prisma.product.count()).toBe(productCountBefore);
    expect(await prisma.listing.count()).toBe(listingCountBefore);

    const persisted = await prisma.product.findUniqueOrThrow({
      where: { id: rejected.id },
      select: { status: true, publishedAt: true, title: true },
    });
    expect(persisted).toEqual({
      status: 'PENDING_REVIEW',
      publishedAt: null,
      title: 'Corrected recovery work',
    });

    const audits = await prisma.auditEvent.findMany({
      where: { targetType: 'PRODUCT', targetId: rejected.id },
      orderBy: { createdAt: 'asc' },
      select: {
        oldStatus: true,
        newStatus: true,
        reason: true,
      },
    });
    expect(audits).toEqual([
      {
        oldStatus: 'PENDING_REVIEW',
        newStatus: 'REJECTED',
        reason: 'Provenance could not be confirmed',
      },
      {
        oldStatus: 'REJECTED',
        newStatus: 'PENDING_REVIEW',
        reason: null,
      },
    ]);

    const reloaded = await clients.approved.get(
      `/seller/products/${rejected.id}`,
    );
    expect(reloaded.status).toBe(200);
    const reloadedBody = (await reloaded.json()) as {
      product: { id: string; status: string; title: string };
      lastModerationReason: string | null;
    };
    expect(reloadedBody.product.id).toBe(rejected.id);
    expect(reloadedBody.product.status).toBe('PENDING_REVIEW');
    expect(reloadedBody.product.title).toBe('Corrected recovery work');
    expect(reloadedBody.lastModerationReason).toBe(
      'Provenance could not be confirmed',
    );
  });

  it('revokes rejected Product writes when the seller is no longer approved', async () => {
    const fixture = await createPermissionFixture(prisma);
    const admin = await createAdmin(randomUUID().replace(/-/g, '').slice(0, 8));
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.6',
    );
    await login(client, fixture.sellers.approved);
    const rejected = await createRejectedProduct(fixture, admin.id);

    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: { status: 'SUSPENDED' },
    });

    expect(
      (
        await client.patch(`/products/${rejected.id}`, {
          title: 'Suspended rewrite',
        })
      ).status,
    ).toBe(403);
    expect(
      (await client.post(`/products/${rejected.id}/submit`, undefined)).status,
    ).toBe(403);
    expect(
      await prisma.product.findUniqueOrThrow({
        where: { id: rejected.id },
        select: { status: true, title: true },
      }),
    ).toEqual({
      status: 'REJECTED',
      title: 'Rejected recovery work',
    });
  });
});

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

function applicationForm(): FormData {
  const form = new FormData();
  form.set('slug', '  wave3-applicant  ');
  form.set('sellerType', 'creator');
  form.set('fullName', '  Applicant Creator  ');
  form.set('country', ' BY ');
  form.set('socialLink', 'https://example.com/applicant');
  form.set('shortDescription', '  Applicant description  ');
  form.set('handoffContactType', 'TELEGRAM');
  form.set('handoffContactValue', '  @wave3_applicant  ');
  form.set(
    'profilePhoto',
    new Blob([permissionImage], { type: 'image/png' }),
    'profile.png',
  );
  return form;
}

async function createAdmin(
  prismaClient: PrismaClient,
  suffix: string,
): Promise<{ id: string; email: string; password: string }> {
  const user = await prismaClient.user.create({
    data: {
      email: `admin.${suffix}@wave3.test`,
      passwordHash: fixturePasswordHash,
      displayName: 'Wave 3 admin',
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

async function createApplication(
  client: HttpTestClient,
): Promise<{ id: string; userId: string }> {
  const response = await client.post('/seller/profile', applicationForm());
  expect(response.status).toBe(201);
  const body = (await response.json()) as {
    sellerProfile: { id: string; userId: string };
  };
  return body.sellerProfile;
}

async function auditFor(
  targetType: 'SELLER_PROFILE' | 'PRODUCT',
  targetId: string,
) {
  return prisma.auditEvent.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: 'asc' },
    select: {
      actorUserId: true,
      targetType: true,
      targetId: true,
      oldStatus: true,
      newStatus: true,
      reason: true,
    },
  });
}

async function adminAndApplicant(fixture: PermissionFixture) {
  const admin = await createAdmin(prisma, Date.now().toString(36));
  const adminClient = new HttpTestClient(
    http.baseUrl,
    'http://localhost:8081',
    '10.0.1.2',
  );
  const applicantClient = new HttpTestClient(
    http.baseUrl,
    'http://localhost:8081',
    '10.0.1.3',
  );
  await login(adminClient, admin);
  await login(applicantClient, fixture.buyer);
  return { admin, adminClient, applicantClient };
}

describe('seller application and moderation audit over HTTP and PostgreSQL', () => {
  it('normalizes and persists a real seller application as PENDING_REVIEW', async () => {
    const fixture = await createPermissionFixture(prisma);
    const applicant = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.1.4',
    );
    await login(applicant, fixture.buyer);

    const profile = await createApplication(applicant);
    const persisted = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: profile.id },
    });

    expect(persisted).toMatchObject({
      userId: fixture.buyer.id,
      slug: 'wave3-applicant',
      fullName: 'Applicant Creator',
      country: 'BY',
      shortDescription: 'Applicant description',
      handoffContactValue: '@wave3_applicant',
      status: 'PENDING_REVIEW',
    });
    expect(persisted.profilePhotoByteLength).toBe(permissionImage.byteLength);
    expect(await auditFor('SELLER_PROFILE', profile.id)).toHaveLength(0);
  });

  it('persists seller moderation transitions, reasons and exactly one audit per accepted transition', async () => {
    const fixture = await createPermissionFixture(prisma);
    const { admin, adminClient, applicantClient } =
      await adminAndApplicant(fixture);
    const profile = await createApplication(applicantClient);

    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${profile.id}/status`, {
          status: 'APPROVED',
        })
      ).status,
    ).toBe(200);
    expect(await auditFor('SELLER_PROFILE', profile.id)).toEqual([
      {
        actorUserId: admin.id,
        targetType: 'SELLER_PROFILE',
        targetId: profile.id,
        oldStatus: 'PENDING_REVIEW',
        newStatus: 'APPROVED',
        reason: null,
      },
    ]);

    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${profile.id}/status`, {
          status: 'CHANGES_REQUESTED',
          reason: 'Add a clearer provenance description',
        })
      ).status,
    ).toBe(200);
    expect(await auditFor('SELLER_PROFILE', profile.id)).toHaveLength(2);
    expect((await auditFor('SELLER_PROFILE', profile.id))[1]).toMatchObject({
      actorUserId: admin.id,
      oldStatus: 'APPROVED',
      newStatus: 'CHANGES_REQUESTED',
      reason: 'Add a clearer provenance description',
    });

    const repeatBefore = await permissionState(prisma);
    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${profile.id}/status`, {
          status: 'CHANGES_REQUESTED',
          reason: 'Repeated request',
        })
      ).status,
    ).toBe(409);
    expect(await permissionState(prisma)).toEqual(repeatBefore);
    expect(await auditFor('SELLER_PROFILE', profile.id)).toHaveLength(2);

    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${profile.id}/status`, {
          status: 'APPROVED',
        })
      ).status,
    ).toBe(200);
    const missingReasonBefore = await permissionState(prisma);
    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${profile.id}/status`, {
          status: 'SUSPENDED',
        })
      ).status,
    ).toBe(400);
    expect(await permissionState(prisma)).toEqual(missingReasonBefore);
    expect(await auditFor('SELLER_PROFILE', profile.id)).toHaveLength(3);

    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${profile.id}/status`, {
          status: 'SUSPENDED',
          reason: 'Application is suspended for review',
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: profile.id },
        })
      ).status,
    ).toBe('SUSPENDED');
    expect(await auditFor('SELLER_PROFILE', profile.id)).toHaveLength(4);

    const rejectedSellerBefore = await permissionState(prisma);
    expect(
      (
        await adminClient.patch(
          `/admin/seller-profiles/${fixture.sellers.pending.profileId}/status`,
          { status: 'REJECTED' },
        )
      ).status,
    ).toBe(400);
    expect(await permissionState(prisma)).toEqual(rejectedSellerBefore);
    expect(
      await auditFor('SELLER_PROFILE', fixture.sellers.pending.profileId),
    ).toHaveLength(0);

    expect(
      (
        await adminClient.patch(
          `/admin/seller-profiles/${fixture.sellers.pending.profileId}/status`,
          {
            status: 'REJECTED',
            reason: 'Application does not meet the creator criteria',
          },
        )
      ).status,
    ).toBe(200);
    expect(
      await prisma.sellerProfile.findUniqueOrThrow({
        where: { id: fixture.sellers.pending.profileId },
      }),
    ).toMatchObject({ status: 'REJECTED' });
    expect(
      await auditFor('SELLER_PROFILE', fixture.sellers.pending.profileId),
    ).toEqual([
      {
        actorUserId: admin.id,
        targetType: 'SELLER_PROFILE',
        targetId: fixture.sellers.pending.profileId,
        oldStatus: 'PENDING_REVIEW',
        newStatus: 'REJECTED',
        reason: 'Application does not meet the creator criteria',
      },
    ]);
  });

  it('preserves moderation locks for scheduled listings and product audit transitions', async () => {
    const fixture = await createPermissionFixture(prisma);
    const { admin, adminClient } = await adminAndApplicant(fixture);

    await prisma.listing.update({
      where: { id: fixture.approvedListingId },
      data: { status: 'SCHEDULED' },
    });

    const sellerBefore = await permissionState(prisma);
    expect(
      (
        await adminClient.patch(
          `/admin/seller-profiles/${fixture.sellers.approved.profileId}/status`,
          {
            status: 'SUSPENDED',
            reason: 'Attempted suspension during auction',
          },
        )
      ).status,
    ).toBe(409);
    expect(await permissionState(prisma)).toEqual(sellerBefore);
    expect(
      await auditFor('SELLER_PROFILE', fixture.sellers.approved.profileId),
    ).toHaveLength(0);

    await prisma.product.update({
      where: { id: fixture.approvedDraftProductId },
      data: {
        status: 'PENDING_REVIEW',
        uniqueness: 'One',
        provenance: 'Wave 3 provenance',
        city: 'Minsk',
        deliveryInfo: 'Pickup',
      },
    });

    expect(
      (
        await adminClient.patch(
          `/admin/products/${fixture.approvedDraftProductId}/status`,
          {
            status: 'APPROVED',
          },
        )
      ).status,
    ).toBe(200);
    expect(await auditFor('PRODUCT', fixture.approvedDraftProductId)).toEqual([
      {
        actorUserId: admin.id,
        targetType: 'PRODUCT',
        targetId: fixture.approvedDraftProductId,
        oldStatus: 'PENDING_REVIEW',
        newStatus: 'APPROVED',
        reason: null,
      },
    ]);

    expect(
      (
        await adminClient.patch(
          `/admin/products/${fixture.approvedDraftProductId}/status`,
          {
            status: 'CHANGES_REQUESTED',
            reason: 'Correct the item story',
          },
        )
      ).status,
    ).toBe(200);
    expect(
      await auditFor('PRODUCT', fixture.approvedDraftProductId),
    ).toHaveLength(2);

    const productRepeatBefore = await permissionState(prisma);
    expect(
      (
        await adminClient.patch(
          `/admin/products/${fixture.approvedDraftProductId}/status`,
          {
            status: 'CHANGES_REQUESTED',
            reason: 'Repeated product request',
          },
        )
      ).status,
    ).toBe(409);
    expect(await permissionState(prisma)).toEqual(productRepeatBefore);
    expect(
      await auditFor('PRODUCT', fixture.approvedDraftProductId),
    ).toHaveLength(2);

    const rejectedProductBefore = await permissionState(prisma);
    expect(
      (
        await adminClient.patch(
          `/admin/products/${fixture.approvedDraftProductId}/status`,
          { status: 'REJECTED' },
        )
      ).status,
    ).toBe(400);
    expect(await permissionState(prisma)).toEqual(rejectedProductBefore);
    expect(
      await auditFor('PRODUCT', fixture.approvedDraftProductId),
    ).toHaveLength(2);

    expect(
      (
        await adminClient.patch(
          `/admin/products/${fixture.approvedDraftProductId}/status`,
          {
            status: 'REJECTED',
            reason: 'The item provenance could not be confirmed',
          },
        )
      ).status,
    ).toBe(200);
    expect(
      await prisma.product.findUniqueOrThrow({
        where: { id: fixture.approvedDraftProductId },
      }),
    ).toMatchObject({ status: 'REJECTED' });
    const rejectedProductAudit = await auditFor(
      'PRODUCT',
      fixture.approvedDraftProductId,
    );
    expect(rejectedProductAudit).toHaveLength(3);
    expect(rejectedProductAudit[2]).toEqual({
      actorUserId: admin.id,
      targetType: 'PRODUCT',
      targetId: fixture.approvedDraftProductId,
      oldStatus: 'CHANGES_REQUESTED',
      newStatus: 'REJECTED',
      reason: 'The item provenance could not be confirmed',
    });

    const lockedProductBefore = await permissionState(prisma);
    expect(
      (
        await adminClient.patch(
          `/admin/products/${fixture.approvedProductId}/status`,
          {
            status: 'CHANGES_REQUESTED',
            reason: 'Cannot change active product',
          },
        )
      ).status,
    ).toBe(409);
    expect(await permissionState(prisma)).toEqual(lockedProductBefore);
    expect(await auditFor('PRODUCT', fixture.approvedProductId)).toHaveLength(
      0,
    );

    const lockedArchiveBefore = await permissionState(prisma);
    expect(
      (
        await adminClient.patch(
          `/admin/products/${fixture.approvedProductId}/status`,
          {
            status: 'ARCHIVED',
            reason: 'Cannot archive an active product',
          },
        )
      ).status,
    ).toBe(409);
    expect(await permissionState(prisma)).toEqual(lockedArchiveBefore);
    expect(await auditFor('PRODUCT', fixture.approvedProductId)).toHaveLength(
      0,
    );

    const archivedProduct = await prisma.product.create({
      data: {
        publicId: `w3arch${randomUUID().replace(/-/g, '').slice(0, 5)}`,
        sellerProfileId: fixture.sellers.otherApproved.profileId,
        categoryId: fixture.categoryId,
        title: 'Product eligible for archival',
        story: 'Product without an active listing',
        uniqueness: 'One',
        provenance: 'Wave 3 moderation fixture',
        city: 'Minsk',
        deliveryInfo: 'Pickup',
        status: 'APPROVED',
        images: {
          create: {
            position: 0,
            mimeType: 'image/png',
            byteLength: permissionImage.byteLength,
            data: permissionImage,
            checksum: '3'.repeat(64),
          },
        },
      },
      select: { id: true },
    });

    expect(
      (
        await adminClient.patch(
          `/admin/products/${archivedProduct.id}/status`,
          {
            status: 'ARCHIVED',
            reason: 'The item is no longer offered',
          },
        )
      ).status,
    ).toBe(200);
    expect(
      await prisma.product.findUniqueOrThrow({
        where: { id: archivedProduct.id },
      }),
    ).toMatchObject({ status: 'ARCHIVED' });
    expect(await auditFor('PRODUCT', archivedProduct.id)).toEqual([
      {
        actorUserId: admin.id,
        targetType: 'PRODUCT',
        targetId: archivedProduct.id,
        oldStatus: 'APPROVED',
        newStatus: 'ARCHIVED',
        reason: 'The item is no longer offered',
      },
    ]);
  });
});

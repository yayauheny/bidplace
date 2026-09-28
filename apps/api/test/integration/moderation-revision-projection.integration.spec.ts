import { createHash, randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import { imageKey } from '../../src/core/image-store/image-key';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  fixturePasswordHash,
  permissionImage,
  resetPermissionFixture,
} from './permission-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

const pendingPhoto = Buffer.from('pending-revision-photo');
const publishedPhoto = Buffer.from(permissionImage);

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

function checksum(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

function applicationForm(slug: string, fullName: string) {
  const form = new FormData();
  form.set('slug', slug);
  form.set('discipline', 'Керамика');
  form.set('fullName', fullName);
  form.set('country', 'BY');
  form.set('city', 'Minsk');
  form.set('shortDescription', 'Published description');
  form.set(
    'profilePhoto',
    new Blob([publishedPhoto], { type: 'image/png' }),
    'profile.png',
  );
  return form;
}

function imageForm(bytes: Buffer = publishedPhoto) {
  const form = new FormData();
  form.append('images', new Blob([bytes], { type: 'image/png' }), 'photo.png');
  return form;
}

async function login(
  client: HttpTestClient,
  user: { email: string; password: string },
) {
  const response = await client.post('/auth/login', {
    email: user.email,
    password: user.password,
  });
  expect(response.status).toBe(201);
}

async function createUser(role: 'admin' | 'user', label: string) {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      email: `${label}.${suffix}@revision.test`,
      passwordHash: fixturePasswordHash,
      displayName: label,
      role,
      emailVerifiedAt: new Date('2026-09-26T12:00:00.000Z'),
      termsAcceptances: {
        create: {
          rulesVersion: 'MVP_RULES_V1',
          acceptedAt: new Date('2026-09-26T12:00:00.000Z'),
        },
      },
    },
    select: { id: true, email: true },
  });
  return { ...user, password: 'password123' };
}

function client(ip: string) {
  return new HttpTestClient(http.baseUrl, 'http://localhost:8081', ip);
}

async function auditCount(targetType: 'SELLER_PROFILE' | 'PRODUCT', targetId: string) {
  return prisma.auditEvent.count({ where: { targetType, targetId } });
}

type AdminSeller = {
  id: string;
  parentStatus: string;
  parentUpdatedAt: string;
  parent: { fullName: string; city: string | null };
  reviewTarget: {
    id: string;
    status: string;
    updatedAt: string;
    content: { fullName: string; city: string | null };
  } | null;
};

async function adminSellers(adminClient: HttpTestClient) {
  const response = await adminClient.get('/admin/seller-profiles');
  expect(response.status).toBe(200);
  return (
    (await response.json()) as { sellerProfiles: AdminSeller[] }
  ).sellerProfiles;
}

async function adminProducts(adminClient: HttpTestClient) {
  const response = await adminClient.get('/admin/products');
  expect(response.status).toBe(200);
  return (
    (await response.json()) as {
      products: Array<{
        id: string;
        parentStatus: string;
        parentUpdatedAt: string;
        parent: { title: string | null; story: string | null; city: string | null };
        reviewTarget: {
          id: string;
          status: string;
          updatedAt: string;
          content: {
            title: string | null;
            story: string | null;
            city: string | null;
            images: Array<{ id: string }>;
          };
        } | null;
      }>;
    }
  ).products;
}

describe('moderation revision projection', () => {
  it('rejects a resubmitted seller revision when the moderator still has the old timestamp', async () => {
    const admin = await createUser('admin', 'admin');
    const owner = await createUser('user', 'owner');
    const adminClient = client('10.2.0.1');
    const ownerClient = client('10.2.0.2');
    await login(adminClient, admin);
    await login(ownerClient, owner);
    const slug = `author-${randomUUID().slice(0, 8)}`;
    expect(
      (
        await ownerClient.post(
          '/seller/profile',
          applicationForm(slug, 'Published author'),
        )
      ).status,
    ).toBe(201);
    expect((await ownerClient.post('/author/application/submit')).status).toBe(201);
    const submitted = (await adminSellers(adminClient)).find(
      (seller) => seller.parent.fullName === 'Published author',
    );
    expect(submitted?.reviewTarget?.status).toBe('PENDING_REVIEW');
    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${submitted!.id}/status`, {
          status: 'CHANGES_REQUESTED',
          reason: 'Clarify the description',
          target: {
            kind: 'revision',
            id: submitted!.reviewTarget!.id,
            updatedAt: submitted!.reviewTarget!.updatedAt,
          },
        })
      ).status,
    ).toBe(200);
    const changed = await prisma.sellerProfileRevision.findUniqueOrThrow({
      where: { id: submitted!.reviewTarget!.id },
      select: { updatedAt: true },
    });
    const form = new FormData();
    form.set('fullName', 'Resubmitted author');
    expect((await ownerClient.patch('/seller/profile', form)).status).toBe(200);
    expect((await ownerClient.post('/author/application/submit')).status).toBe(201);
    const resubmitted = await prisma.sellerProfileRevision.findUniqueOrThrow({
      where: { id: submitted!.reviewTarget!.id },
      select: { status: true, updatedAt: true },
    });
    expect(resubmitted.status).toBe('PENDING_REVIEW');
    expect(resubmitted.updatedAt.getTime()).not.toBe(changed.updatedAt.getTime());
    const audits = await auditCount('SELLER_PROFILE', submitted!.id);
    const stale = await adminClient.patch(
      `/admin/seller-profiles/${submitted!.id}/status`,
      {
        status: 'APPROVED',
        target: {
          kind: 'revision',
          id: submitted!.reviewTarget!.id,
          updatedAt: changed.updatedAt.toISOString(),
        },
      },
    );
    expect(stale.status).toBe(409);
    expect(await auditCount('SELLER_PROFILE', submitted!.id)).toBe(audits);
    expect(
      await prisma.sellerProfileRevision.findUniqueOrThrow({
        where: { id: submitted!.reviewTarget!.id },
        select: { status: true, fullName: true },
      }),
    ).toEqual({ status: 'PENDING_REVIEW', fullName: 'Resubmitted author' });
  });

  it('keeps an approved seller published when a revision is changed or rejected', async () => {
    const admin = await createUser('admin', 'admin');
    const owner = await createUser('user', 'owner');
    const guest = client('10.2.0.3');
    const strangerUser = await createUser('user', 'stranger');
    const adminClient = client('10.2.0.4');
    const ownerClient = client('10.2.0.5');
    const stranger = client('10.2.0.6');
    await login(adminClient, admin);
    await login(ownerClient, owner);
    await login(stranger, strangerUser);
    const slug = `author-${randomUUID().slice(0, 8)}`;
    expect(
      (
        await ownerClient.post(
          '/seller/profile',
          applicationForm(slug, 'Published author'),
        )
      ).status,
    ).toBe(201);
    expect((await ownerClient.post('/author/application/submit')).status).toBe(201);
    const pending = (await adminSellers(adminClient)).find(
      (seller) => seller.id.length > 0 && seller.reviewTarget?.content.fullName === 'Published author',
    )!;
    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${pending.id}/status`, {
          status: 'APPROVED',
          target: {
            kind: 'revision',
            id: pending.reviewTarget!.id,
            updatedAt: pending.reviewTarget!.updatedAt,
          },
        })
      ).status,
    ).toBe(200);
    const edited = new FormData();
    edited.set('fullName', 'Pending author');
    expect((await ownerClient.patch('/seller/profile', edited)).status).toBe(200);
    expect((await ownerClient.post('/author/application/submit')).status).toBe(201);
    const review = (await adminSellers(adminClient)).find(
      (seller) => seller.id === pending.id,
    )!;
    expect(review.parentStatus).toBe('APPROVED');
    expect(review.reviewTarget?.content.fullName).toBe('Pending author');
    expect(review.parent.fullName).toBe('Published author');
    const ownerProfile = await ownerClient.get('/seller/profile');
    expect(ownerProfile.status).toBe(200);
    expect(JSON.stringify(await ownerProfile.json())).toContain('Pending author');
    const publicAuthor = await guest.get(`/authors/${slug}`);
    expect(publicAuthor.status).toBe(200);
    const publicAuthorBody = JSON.stringify(await publicAuthor.json());
    expect(publicAuthorBody).toContain('Published author');
    expect(publicAuthorBody).not.toContain('Pending author');
    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${pending.id}/status`, {
          status: 'CHANGES_REQUESTED',
          reason: 'Need a clearer name',
          target: {
            kind: 'revision',
            id: review.reviewTarget!.id,
            updatedAt: review.reviewTarget!.updatedAt,
          },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { id: pending.id },
          select: { status: true, fullName: true },
        })
      ),
    ).toEqual({ status: 'APPROVED', fullName: 'Published author' });
    expect((await ownerClient.post('/author/application/submit')).status).toBe(201);
    const again = (await adminSellers(adminClient)).find(
      (seller) => seller.id === pending.id,
    )!;
    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${pending.id}/status`, {
          status: 'REJECTED',
          reason: 'The revision is not ready',
          target: {
            kind: 'revision',
            id: again.reviewTarget!.id,
            updatedAt: again.reviewTarget!.updatedAt,
          },
        })
      ).status,
    ).toBe(200);
    expect(
      await prisma.sellerProfile.findUniqueOrThrow({
        where: { id: pending.id },
        select: { status: true, fullName: true },
      }),
    ).toEqual({ status: 'APPROVED', fullName: 'Published author' });
    const strangerAuthor = await stranger.get(`/authors/${slug}`);
    expect(JSON.stringify(await strangerAuthor.json())).not.toContain('Pending author');
  });

  it('restores seller visibility without publishing the pending revision', async () => {
    const admin = await createUser('admin', 'admin');
    const owner = await createUser('user', 'owner');
    const adminClient = client('10.2.0.7');
    const ownerClient = client('10.2.0.8');
    await login(adminClient, admin);
    await login(ownerClient, owner);
    const slug = `author-${randomUUID().slice(0, 8)}`;
    expect(
      (
        await ownerClient.post(
          '/seller/profile',
          applicationForm(slug, 'Published author'),
        )
      ).status,
    ).toBe(201);
    expect((await ownerClient.post('/author/application/submit')).status).toBe(201);
    const pending = (await adminSellers(adminClient)).find((seller) =>
      seller.reviewTarget?.content.fullName === 'Published author',
    )!;
    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${pending.id}/status`, {
          status: 'APPROVED',
          target: {
            kind: 'revision',
            id: pending.reviewTarget!.id,
            updatedAt: pending.reviewTarget!.updatedAt,
          },
        })
      ).status,
    ).toBe(200);
    const approved = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: pending.id },
      select: { updatedAt: true, publishedRevisionId: true },
    });
    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${pending.id}/status`, {
          status: 'SUSPENDED',
          reason: 'Temporary visibility hold',
          target: {
            kind: 'parent',
            status: 'APPROVED',
            updatedAt: approved.updatedAt.toISOString(),
          },
        })
      ).status,
    ).toBe(200);
    await prisma.sellerProfileRevision.update({
      where: { id: approved.publishedRevisionId! },
      data: { status: 'PENDING_REVIEW', fullName: 'Unpublished revision' },
    });
    const suspended = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: pending.id },
      select: { updatedAt: true, fullName: true },
    });
    const restored = await adminClient.patch(
      `/admin/seller-profiles/${pending.id}/status`,
      {
        status: 'APPROVED',
        target: {
          kind: 'parent',
          status: 'SUSPENDED',
          updatedAt: suspended.updatedAt.toISOString(),
        },
      },
    );
    expect(restored.status).toBe(200);
    expect(
      await prisma.sellerProfile.findUniqueOrThrow({
        where: { id: pending.id },
        select: { status: true, fullName: true },
      }),
    ).toEqual({ status: 'APPROVED', fullName: 'Published author' });
    expect(
      await prisma.sellerProfileRevision.findUniqueOrThrow({
        where: { id: approved.publishedRevisionId! },
        select: { status: true, fullName: true },
      }),
    ).toEqual({ status: 'PENDING_REVIEW', fullName: 'Unpublished revision' });
  });

  it('keeps a legacy pending seller approvable only through the parent target', async () => {
    const admin = await createUser('admin', 'admin');
    const owner = await createUser('user', 'legacy');
    const adminClient = client('10.2.0.9');
    await login(adminClient, admin);
    const legacy = await prisma.sellerProfile.create({
      data: {
        userId: owner.id,
        slug: `legacy-${randomUUID().slice(0, 8)}`,
        sellerType: 'creator',
        fullName: 'Legacy author',
        country: 'BY',
        city: 'Minsk',
        discipline: 'Керамика',
        shortDescription: 'Legacy description',
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: publishedPhoto.byteLength,
        profilePhotoChecksum: checksum(publishedPhoto),
        profilePhotoData: publishedPhoto,
        status: 'PENDING_REVIEW',
      },
      select: { id: true, updatedAt: true },
    });
    const listed = (await adminSellers(adminClient)).find(
      (seller) => seller.id === legacy.id,
    );
    expect(listed).toMatchObject({
      parentStatus: 'PENDING_REVIEW',
      reviewTarget: null,
    });
    const revisionAttempt = await adminClient.patch(
      `/admin/seller-profiles/${legacy.id}/status`,
      {
        status: 'APPROVED',
        target: {
          kind: 'revision',
          id: '00000000-0000-4000-8000-000000000099',
          updatedAt: legacy.updatedAt.toISOString(),
        },
      },
    );
    expect(revisionAttempt.status).toBe(409);
    expect(await auditCount('SELLER_PROFILE', legacy.id)).toBe(0);
    const approved = await adminClient.patch(
      `/admin/seller-profiles/${legacy.id}/status`,
      {
        status: 'APPROVED',
        target: {
          kind: 'parent',
          status: 'PENDING_REVIEW',
          updatedAt: legacy.updatedAt.toISOString(),
        },
      },
    );
    expect(approved.status).toBe(200);
    expect(
      await prisma.sellerProfile.findUniqueOrThrow({
        where: { id: legacy.id },
        select: { status: true, editingRevisionId: true },
      }),
    ).toEqual({ status: 'APPROVED', editingRevisionId: null });

    const revisionOwner = await createUser('user', 'revision-owner');
    const revisionClient = client('10.2.0.10');
    await login(revisionClient, revisionOwner);
    const slug = `revision-${randomUUID().slice(0, 8)}`;
    expect(
      (
        await revisionClient.post(
          '/seller/profile',
          applicationForm(slug, 'Revision author'),
        )
      ).status,
    ).toBe(201);
    expect((await revisionClient.post('/author/application/submit')).status).toBe(
      201,
    );
    const backed = (await adminSellers(adminClient)).find(
      (seller) => seller.reviewTarget?.content.fullName === 'Revision author',
    )!;
    const fallback = await adminClient.patch(
      `/admin/seller-profiles/${backed.id}/status`,
      {
        status: 'APPROVED',
        target: {
          kind: 'parent',
          status: backed.parentStatus,
          updatedAt: backed.parentUpdatedAt,
        },
      },
    );
    expect(fallback.status).toBe(409);
    expect(
      await prisma.sellerProfile.findUniqueOrThrow({
        where: { id: backed.id },
        select: { status: true },
      }),
    ).toEqual({ status: 'PENDING_REVIEW' });
    expect(await auditCount('SELLER_PROFILE', backed.id)).toBe(0);
  });

  it('serves one photo source and hides pending media from guests and strangers', async () => {
    const admin = await createUser('admin', 'admin');
    const owner = await createUser('user', 'owner');
    const strangerUser = await createUser('user', 'stranger');
    const adminClient = client('10.2.0.11');
    const ownerClient = client('10.2.0.12');
    const stranger = client('10.2.0.13');
    const guest = client('10.2.0.14');
    await login(adminClient, admin);
    await login(ownerClient, owner);
    await login(stranger, strangerUser);
    const slug = `photo-${randomUUID().slice(0, 8)}`;
    expect(
      (
        await ownerClient.post(
          '/seller/profile',
          applicationForm(slug, 'Photo author'),
        )
      ).status,
    ).toBe(201);
    expect((await ownerClient.post('/author/application/submit')).status).toBe(201);
    const pending = (await adminSellers(adminClient)).find(
      (seller) => seller.reviewTarget?.content.fullName === 'Photo author',
    )!;
    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${pending.id}/status`, {
          status: 'APPROVED',
          target: {
            kind: 'revision',
            id: pending.reviewTarget!.id,
            updatedAt: pending.reviewTarget!.updatedAt,
          },
        })
      ).status,
    ).toBe(200);
    const profile = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: pending.id },
      select: { publishedRevisionId: true },
    });
    await prisma.sellerProfileRevision.update({
      where: { id: profile.publishedRevisionId! },
      data: {
        status: 'PENDING_REVIEW',
        fullName: 'Pending photo author',
        profilePhotoMimeType: 'image/jpeg',
        profilePhotoByteLength: pendingPhoto.byteLength,
        profilePhotoChecksum: checksum(pendingPhoto),
        profilePhotoObjectKey: imageKey.sellerProfileRevision(
          profile.publishedRevisionId!,
        ),
        profilePhotoData: pendingPhoto,
      },
    });
    const adminPhoto = await adminClient.get(
      `/admin/seller-profiles/${pending.id}/revisions/${profile.publishedRevisionId}/photo`,
    );
    expect(adminPhoto.status).toBe(200);
    expect(adminPhoto.headers.get('cache-control')).toBe('private, no-store');
    expect(adminPhoto.headers.get('content-type')).toContain('image/jpeg');
    expect(Buffer.from(await adminPhoto.arrayBuffer())).toEqual(pendingPhoto);
    const storedParent = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: pending.id },
      select: { profilePhotoData: true },
    });
    const publishedBytes = Buffer.from(storedParent.profilePhotoData);
    const publicPhoto = await guest.get(`/sellers/${slug}/photo`);
    expect(publicPhoto.status).toBe(200);
    expect(Buffer.from(await publicPhoto.arrayBuffer())).toEqual(publishedBytes);
    const strangerPhoto = await stranger.get(`/sellers/${slug}/photo`);
    expect(strangerPhoto.status).toBe(200);
    expect(Buffer.from(await strangerPhoto.arrayBuffer())).toEqual(publishedBytes);
    expect(publishedBytes.equals(pendingPhoto)).toBe(false);
    expect((await guest.get(
      `/admin/seller-profiles/${pending.id}/revisions/${profile.publishedRevisionId}/photo`,
    )).status).toBe(401);
    expect((await stranger.get(
      `/admin/seller-profiles/${pending.id}/revisions/${profile.publishedRevisionId}/photo`,
    )).status).toBe(403);

    await prisma.sellerProfileRevision.update({
      where: { id: profile.publishedRevisionId! },
      data: {
        profilePhotoMimeType: 'image/jpeg',
        profilePhotoByteLength: null,
        profilePhotoChecksum: null,
        profilePhotoObjectKey: null,
        profilePhotoData: null,
      },
    });
    const fallback = await adminClient.get(
      `/admin/seller-profiles/${pending.id}/revisions/${profile.publishedRevisionId}/photo`,
    );
    expect(fallback.status).toBe(200);
    expect(fallback.headers.get('content-type')).toContain('image/png');
    expect(Buffer.from(await fallback.arrayBuffer())).toEqual(publishedBytes);

    const category = await prisma.category.create({
      data: { slug: `cat-${randomUUID().slice(0, 8)}`, name: 'Projection' },
    });
    const created = await ownerClient.post('/products', {
      title: 'Published work',
      categoryId: category.id,
    });
    expect(created.status).toBe(201);
    const product = (
      (await created.json()) as { product: { id: string; publicId: string } }
    ).product;
    expect((await ownerClient.post(`/products/${product.id}/images`, imageForm())).status).toBe(201);
    expect((await ownerClient.post(`/products/${product.id}/submit`)).status).toBe(201);
    const queued = (await adminProducts(adminClient)).find(
      (item) => item.id === product.id,
    )!;
    expect(
      (
        await adminClient.patch(`/admin/products/${product.id}/status`, {
          status: 'APPROVED',
          target: {
            kind: 'revision',
            id: queued.reviewTarget!.id,
            updatedAt: queued.reviewTarget!.updatedAt,
          },
        })
      ).status,
    ).toBe(200);
    const publishedImage = await prisma.productImage.findFirstOrThrow({
      where: { productId: product.id },
      select: { id: true },
    });
    const hidden = await prisma.productImage.create({
      data: {
        productId: product.id,
        position: 1,
        mimeType: 'image/png',
        byteLength: pendingPhoto.byteLength,
        data: pendingPhoto,
        checksum: checksum(pendingPhoto),
      },
    });
    const editing = await prisma.productRevision.create({
      data: {
        productId: product.id,
        version: 2,
        status: 'PENDING_REVIEW',
        categoryId: category.id,
        title: 'Pending work',
        images: { create: { imageId: hidden.id, position: 0 } },
      },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { editingRevisionId: editing.id },
    });
    expect((await guest.get(`/images/${hidden.id}`)).status).toBe(404);
    expect((await stranger.get(`/images/${hidden.id}`)).status).toBe(404);
    expect((await guest.get(`/images/${publishedImage.id}`)).status).toBe(200);
    expect((await ownerClient.get(`/images/${hidden.id}`)).status).toBe(200);
    const listed = (await adminProducts(adminClient)).find(
      (item) => item.id === product.id,
    )!;
    expect(listed.parent.title).toBe('Published work');
    expect(listed.reviewTarget?.content.title).toBe('Pending work');
    expect(listed.reviewTarget?.content.images.map((image) => image.id)).toEqual([
      hidden.id,
    ]);
    await prisma.productRevision.update({
      where: { id: editing.id },
      data: { story: null, city: null },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { story: 'Published story', city: 'Minsk' },
    });
    const nulled = (await adminProducts(adminClient)).find(
      (item) => item.id === product.id,
    )!;
    expect(nulled.parent.story).toBe('Published story');
    expect(nulled.parent.city).toBe('Minsk');
    expect(nulled.reviewTarget?.content.story).toBeNull();
    expect(nulled.reviewTarget?.content.city).toBeNull();
  });

  it('rejects a resubmitted product revision and preserves the approved parent', async () => {
    const admin = await createUser('admin', 'admin');
    const owner = await createUser('user', 'owner');
    const adminClient = client('10.2.0.15');
    const ownerClient = client('10.2.0.16');
    await login(adminClient, admin);
    await login(ownerClient, owner);
    const slug = `work-${randomUUID().slice(0, 8)}`;
    expect(
      (
        await ownerClient.post(
          '/seller/profile',
          applicationForm(slug, 'Work author'),
        )
      ).status,
    ).toBe(201);
    expect((await ownerClient.post('/author/application/submit')).status).toBe(201);
    const author = (await adminSellers(adminClient)).find(
      (seller) => seller.reviewTarget?.content.fullName === 'Work author',
    )!;
    expect(
      (
        await adminClient.patch(`/admin/seller-profiles/${author.id}/status`, {
          status: 'APPROVED',
          target: {
            kind: 'revision',
            id: author.reviewTarget!.id,
            updatedAt: author.reviewTarget!.updatedAt,
          },
        })
      ).status,
    ).toBe(200);
    const category = await prisma.category.create({
      data: { slug: `works-${randomUUID().slice(0, 8)}`, name: 'Works' },
    });
    const created = await ownerClient.post('/products', {
      title: 'Published work',
      categoryId: category.id,
    });
    const product = (
      (await created.json()) as { product: { id: string } }
    ).product;
    expect((await ownerClient.post(`/products/${product.id}/images`, imageForm())).status).toBe(201);
    expect((await ownerClient.post(`/products/${product.id}/submit`)).status).toBe(201);
    const queued = (await adminProducts(adminClient)).find(
      (item) => item.id === product.id,
    )!;
    expect(
      (
        await adminClient.patch(`/admin/products/${product.id}/status`, {
          status: 'APPROVED',
          target: {
            kind: 'revision',
            id: queued.reviewTarget!.id,
            updatedAt: queued.reviewTarget!.updatedAt,
          },
        })
      ).status,
    ).toBe(200);
    expect(
      (await ownerClient.patch(`/products/${product.id}`, { title: 'Pending work' })).status,
    ).toBe(200);
    expect((await ownerClient.post(`/products/${product.id}/submit`)).status).toBe(201);
    const pending = (await adminProducts(adminClient)).find(
      (item) => item.id === product.id,
    )!;
    const changedAt = pending.reviewTarget!.updatedAt;
    expect(
      (
        await adminClient.patch(`/admin/products/${product.id}/status`, {
          status: 'CHANGES_REQUESTED',
          reason: 'Adjust the title',
          target: {
            kind: 'revision',
            id: pending.reviewTarget!.id,
            updatedAt: changedAt,
          },
        })
      ).status,
    ).toBe(200);
    expect(
      await prisma.product.findUniqueOrThrow({
        where: { id: product.id },
        select: { status: true, title: true },
      }),
    ).toEqual({ status: 'APPROVED', title: 'Published work' });
    expect(
      (await ownerClient.patch(`/products/${product.id}`, { title: 'Resubmitted work' })).status,
    ).toBe(200);
    expect((await ownerClient.post(`/products/${product.id}/submit`)).status).toBe(201);
    const audits = await auditCount('PRODUCT', product.id);
    const stale = await adminClient.patch(`/admin/products/${product.id}/status`, {
      status: 'APPROVED',
      target: {
        kind: 'revision',
        id: pending.reviewTarget!.id,
        updatedAt: changedAt,
      },
    });
    expect(stale.status).toBe(409);
    expect(await auditCount('PRODUCT', product.id)).toBe(audits);
    const resubmitted = (await adminProducts(adminClient)).find(
      (item) => item.id === product.id,
    )!;
    expect(
      (
        await adminClient.patch(`/admin/products/${product.id}/status`, {
          status: 'REJECTED',
          reason: 'The revision is not ready',
          target: {
            kind: 'revision',
            id: resubmitted.reviewTarget!.id,
            updatedAt: resubmitted.reviewTarget!.updatedAt,
          },
        })
      ).status,
    ).toBe(200);
    expect(
      await prisma.product.findUniqueOrThrow({
        where: { id: product.id },
        select: { status: true, title: true },
      }),
    ).toEqual({ status: 'APPROVED', title: 'Published work' });

    const archivedParent = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { updatedAt: true },
    });
    expect(
      (
        await adminClient.patch(`/admin/products/${product.id}/status`, {
          status: 'ARCHIVED',
          reason: 'Hide the published work',
          target: {
            kind: 'parent',
            status: 'APPROVED',
            updatedAt: archivedParent.updatedAt.toISOString(),
          },
        })
      ).status,
    ).toBe(200);
    const currentRevision = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { editingRevisionId: true, title: true },
    });
    await prisma.productRevision.update({
      where: { id: currentRevision.editingRevisionId! },
      data: { status: 'PENDING_REVIEW', title: 'Should stay unpublished' },
    });
    const archived = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { updatedAt: true },
    });
    expect(
      (
        await adminClient.patch(`/admin/products/${product.id}/status`, {
          status: 'APPROVED',
          target: {
            kind: 'parent',
            status: 'ARCHIVED',
            updatedAt: archived.updatedAt.toISOString(),
          },
        })
      ).status,
    ).toBe(200);
    expect(
      await prisma.product.findUniqueOrThrow({
        where: { id: product.id },
        select: { status: true, title: true },
      }),
    ).toEqual({ status: 'APPROVED', title: 'Published work' });
    expect(
      await prisma.productRevision.findUniqueOrThrow({
        where: { id: currentRevision.editingRevisionId! },
        select: { status: true, title: true },
      }),
    ).toEqual({ status: 'PENDING_REVIEW', title: 'Should stay unpublished' });
  });
});

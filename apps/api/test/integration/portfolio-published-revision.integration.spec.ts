import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { Prisma, PrismaClient } from '@bidplace/database';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createPermissionFixture,
  fixturePasswordHash,
  permissionImage,
  resetPermissionFixture,
} from './permission-fixtures';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import { productModerationRequest } from './admin-status-request';
import { productImageAuthorizationSelect } from '../../src/images/images.service';
import {
  portfolioCatalogProductSelect,
  productImageMetadataSelect,
  productRevisionGallerySelect,
} from '../../src/products/products.mapper';
import { publicSellerProfileSelect } from '../../src/sellers/seller-profile.mapper';

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

function imageForm(): FormData {
  const form = new FormData();
  form.append(
    'images',
    new Blob([permissionImage], { type: 'image/png' }),
    'photo.png',
  );
  return form;
}

async function login(client: HttpTestClient, email: string, password: string) {
  const response = await client.post('/auth/login', { email, password });
  expect(response.status).toBe(201);
}

describe('portfolio published revision HTTP transport', () => {
  it('keeps RFC-minimal Work public JSON on the published revision through edit, approve, hide and unhide', async () => {
    const fixture = await createPermissionFixture(prisma);
    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: { city: 'Minsk', discipline: 'Автор' },
    });
    const admin = await prisma.user.create({
      data: {
        email: `admin.portfolio.${fixture.categoryId.slice(0, 8)}@wave3.test`,
        passwordHash: fixturePasswordHash,
        displayName: 'Portfolio admin',
        role: 'admin',
      },
      select: { email: true },
    });
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const adminClient = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    await login(
      owner,
      fixture.sellers.approved.email,
      fixture.sellers.approved.password,
    );
    await login(adminClient, admin.email, 'password123');

    const created = await owner.post('/products', {
      title: 'RFC minimal work',
      categoryId: fixture.categoryId,
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      product: { id: string; publicId: string };
    };
    const productId = createdBody.product.id;
    const publicId = createdBody.product.publicId;

    expect(
      (await owner.post(`/products/${productId}/images`, imageForm())).status,
    ).toBe(201);
    expect((await owner.post(`/products/${productId}/submit`)).status).toBe(201);
    expect(
      (
        await adminClient.patch(
          `/admin/products/${productId}/status`,
          await productModerationRequest(prisma, productId, 'APPROVED'),
        )
      ).status,
    ).toBe(200);

    const published = await guest.get(`/works/${publicId}`);
    expect(published.status).toBe(200);
    const publishedBody = (await published.json()) as {
      work: { story: string | null; images: Array<{ id: string }> };
    };
    expect(publishedBody.work.story).toBeNull();
    expect(publishedBody.work.images).toHaveLength(1);
    const publishedImageId = publishedBody.work.images[0]!.id;

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: {
        publishedRevisionId: true,
        publishedRevision: {
          select: {
            categoryId: true,
            title: true,
            story: true,
            version: true,
          },
        },
      },
    });
    const pendingImage = await prisma.productImage.create({
      data: {
        productId,
        position: 1,
        mimeType: 'image/png',
        byteLength: permissionImage.byteLength,
        data: permissionImage,
        checksum: '9'.repeat(64),
      },
      select: { id: true },
    });
    const pendingRevision = await prisma.productRevision.create({
      data: {
        productId,
        version: (product.publishedRevision?.version ?? 1) + 1,
        status: 'PENDING_REVIEW',
        categoryId: product.publishedRevision?.categoryId ?? fixture.categoryId,
        title: product.publishedRevision?.title ?? 'RFC minimal work',
        story: product.publishedRevision?.story ?? null,
        images: {
          create: [
            { imageId: publishedImageId, position: 0 },
            { imageId: pendingImage.id, position: 1 },
          ],
        },
      },
      select: { id: true },
    });
    await prisma.product.update({
      where: { id: productId },
      data: { editingRevisionId: pendingRevision.id },
    });

    const pendingPublic = await guest.get(`/works/${publicId}`);
    expect(pendingPublic.status).toBe(200);
    expect(
      ((await pendingPublic.json()) as { work: { images: unknown[] } }).work
        .images,
    ).toHaveLength(1);
    expect((await guest.get(`/images/${pendingImage.id}`)).status).toBe(404);
    expect((await guest.get(`/images/${publishedImageId}`)).status).toBe(200);

    await prisma.productRevision.update({
      where: { id: pendingRevision.id },
      data: { status: 'APPROVED' },
    });
    await prisma.product.update({
      where: { id: productId },
      data: { publishedRevisionId: pendingRevision.id },
    });

    const approvedAgain = await guest.get(`/works/${publicId}`);
    expect(approvedAgain.status).toBe(200);
    expect(
      ((await approvedAgain.json()) as { work: { images: unknown[] } }).work
        .images,
    ).toHaveLength(2);

    expect((await owner.post(`/products/${productId}/hide`)).status).toBe(201);
    expect((await guest.get(`/works/${publicId}`)).status).toBe(404);
    expect((await guest.get(`/images/${publishedImageId}`)).status).toBe(404);

    expect((await owner.post(`/products/${productId}/unhide`)).status).toBe(201);
    const restored = await guest.get(`/works/${publicId}`);
    expect(restored.status).toBe(200);
    expect(
      ((await restored.json()) as { work: { images: unknown[] } }).work.images,
    ).toHaveLength(2);
  });

  it('keeps an author without listings visible on the public author route', async () => {
    const fixture = await createPermissionFixture(prisma);
    await prisma.listing.deleteMany({
      where: { product: { sellerProfileId: fixture.sellers.approved.profileId } },
    });
    const author = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: { slug: true },
    });
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    const response = await guest.get(`/authors/${author.slug}`);
    expect(response.status).toBe(200);
    expect(
      ((await response.json()) as { author: { slug: string } }).author.slug,
    ).toBe(author.slug);
  });

  it('rejects unsupported achievement images and hides unpublished bytes from guests', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const stranger = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(
      owner,
      fixture.sellers.changes.email,
      fixture.sellers.changes.password,
    );
    await login(
      stranger,
      fixture.sellers.otherApproved.email,
      fixture.sellers.otherApproved.password,
    );

    const gif = new FormData();
    gif.set('body', 'Show');
    gif.set('occurredDate', JSON.stringify({ year: 2025, month: 3, day: null }));
    gif.append(
      'image',
      new Blob(
        [
          Buffer.from(
            'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\x00\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;',
          ),
        ],
        { type: 'image/gif' },
      ),
      'animation.gif',
    );
    expect((await owner.post('/author/application/achievements', gif)).status).toBe(
      400,
    );

    const uploaded = await owner.post(
      '/author/application/achievements',
      (() => {
        const form = new FormData();
        form.set('body', 'Show');
        form.set('occurredDate', JSON.stringify({ year: 2025, month: 3, day: null }));
        form.append(
          'image',
          new Blob([permissionImage], { type: 'image/png' }),
          'show.png',
        );
        return form;
      })(),
    );
    expect(uploaded.status).toBe(201);
    const uploadedId = (
      (await uploaded.json()) as { achievement: { id: string } }
    ).achievement.id;
    const ownerImage = await owner.get(
      `/author-achievements/${uploadedId}/image`,
    );
    expect(ownerImage.status).toBe(200);
    expect(ownerImage.headers.get('content-type')).toMatch(/image\/png/);
    expect(Buffer.from(await ownerImage.arrayBuffer()).subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(
      (await guest.get(`/author-achievements/${uploadedId}/image`)).status,
    ).toBe(404);
    expect(
      (await stranger.get(`/author-achievements/${uploadedId}/image`)).status,
    ).toBe(404);

    const created = await owner.post('/author/application/achievements', (() => {
      const form = new FormData();
      form.set('body', 'Show text only');
      form.set('occurredDate', JSON.stringify({ year: 2025, month: 3, day: null }));
      return form;
    })());
    expect(created.status).toBe(201);
    const achievementId = (
      (await created.json()) as { achievement: { id: string } }
    ).achievement.id;

    expect((await guest.get(`/author-achievements/${achievementId}/image`)).status).toBe(
      404,
    );
    expect(
      (await stranger.delete(`/author/application/achievements/${achievementId}`))
        .status,
    ).toBe(404);
  });

  it('keeps the public profile photo on the published object after a pending owner edit', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const author = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: { slug: true, editingRevisionId: true },
    });
    await prisma.sellerProfileRevision.update({
      where: { id: author.editingRevisionId! },
      data: {
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: permissionImage.byteLength,
        profilePhotoChecksum: '0'.repeat(64),
        profilePhotoObjectKey: `seller-photo:${fixture.sellers.approved.profileId}`,
        profilePhotoData: permissionImage,
      },
    });
    await login(
      owner,
      fixture.sellers.approved.email,
      fixture.sellers.approved.password,
    );

    const nextPhoto = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const photoForm = new FormData();
    photoForm.set('fullName', 'Pending photo author');
    photoForm.append(
      'profilePhoto',
      new Blob([nextPhoto], { type: 'image/png' }),
      'next.png',
    );
    expect((await owner.patch('/seller/profile', photoForm)).status).toBe(200);

    const publicPhoto = await guest.get(`/sellers/${author.slug}/photo`);
    expect(publicPhoto.status).toBe(200);
    expect(Buffer.from(await publicPhoto.arrayBuffer())).toEqual(permissionImage);

    const ownerPhoto = await owner.get('/author/application/photo');
    expect(ownerPhoto.status).toBe(200);
    const ownerPhotoBytes = Buffer.from(await ownerPhoto.arrayBuffer());
    expect(ownerPhoto.headers.get('content-type')).toMatch(/image\/png/);
    expect(ownerPhotoBytes.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(ownerPhotoBytes).not.toEqual(permissionImage);
  });

  it('keeps public Work and media parity while reading less unused data', async () => {
    const fixture = await createPermissionFixture(prisma);
    const author = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: { slug: true, publishedRevisionId: true },
    });
    const existing = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.approvedProductId },
      select: { publicId: true },
    });
    const biography = `BIOGRAPHY_MARKER${'б'.repeat(80_000)}`;
    const parentStory = `PARENT_STORY_MARKER${'п'.repeat(60_000)}`;
    const publishedStory = 'Published story for the public work';
    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: { biography },
    });
    await prisma.sellerProfileRevisionAchievement.createMany({
      data: Array.from({ length: 8 }, (_, position) => ({
        revisionId: author.publishedRevisionId!,
        position,
        body: `ACHIEVEMENT_MARKER ${position} ${'а'.repeat(4_000)}`,
      })),
    });

    const publicId = `n${randomUUID().replaceAll('-', '').slice(0, 10)}`;
    const work = await prisma.product.create({
      data: {
        publicId,
        sellerProfileId: fixture.sellers.approved.profileId,
        categoryId: null,
        title: 'Parent title hidden',
        story: parentStory,
        technique: 'Parent technique',
        materials: 'Parent material',
        year: 1999,
        uniqueness: 'parent-unique',
        provenance: `PARENT_PROVENANCE_MARKER${'п'.repeat(10_000)}`,
        status: 'APPROVED',
        publishedAt: new Date('2026-09-01T00:00:00.000Z'),
        images: {
          create: [
            {
              position: 0,
              mimeType: 'image/png',
              byteLength: permissionImage.byteLength,
              data: permissionImage,
              checksum: 'b'.repeat(64),
              width: 640,
              height: 480,
            },
            {
              position: 1,
              mimeType: 'image/png',
              byteLength: permissionImage.byteLength,
              data: permissionImage,
              checksum: 'c'.repeat(64),
            },
            {
              position: 2,
              mimeType: 'image/png',
              byteLength: permissionImage.byteLength,
              data: permissionImage,
              checksum: 'd'.repeat(64),
            },
          ],
        },
      },
      select: {
        id: true,
        images: { orderBy: { position: 'asc' }, select: { id: true } },
      },
    });
    const [publishedWorkImage, pendingImage, parentOnlyImage] = work.images;
    const publishedRevision = await prisma.productRevision.create({
      data: {
        productId: work.id,
        version: 1,
        status: 'APPROVED',
        categoryId: fixture.categoryId,
        title: 'Published ceramic bowl',
        story: publishedStory,
        technique: 'Published technique',
        materials: 'Published material',
        year: 2024,
        uniqueness: 'published-unique',
        images: {
          create: { imageId: publishedWorkImage!.id, position: 0 },
        },
      },
      select: { id: true },
    });
    const editingRevision = await prisma.productRevision.create({
      data: {
        productId: work.id,
        version: 2,
        status: 'PENDING_REVIEW',
        categoryId: fixture.categoryId,
        title: 'Editing title hidden',
        story: 'Editing story hidden',
        images: { create: { imageId: pendingImage!.id, position: 0 } },
      },
      select: { id: true },
    });
    await prisma.product.update({
      where: { id: work.id },
      data: {
        publishedRevisionId: publishedRevision.id,
        editingRevisionId: editingRevision.id,
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: `admin.narrow.${fixture.categoryId.slice(0, 8)}@wave3.test`,
        passwordHash: fixturePasswordHash,
        displayName: 'Narrow admin',
        role: 'admin',
      },
      select: { email: true },
    });
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081', '10.8.0.1');
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081', '10.8.0.2');
    const stranger = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.8.0.3',
    );
    const adminClient = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.8.0.4',
    );
    await login(owner, fixture.sellers.approved.email, fixture.sellers.approved.password);
    await login(
      stranger,
      fixture.sellers.otherApproved.email,
      fixture.sellers.otherApproved.password,
    );
    await login(adminClient, admin.email, 'password123');

    const detail = await guest.get(`/works/${publicId}`);
    expect(detail.status).toBe(200);
    const detailBody = (await detail.json()) as {
      work: {
        title: string;
        story: string | null;
        year: number | null;
        uniqueness: string | null;
        materials: string | null;
        categoryId: string;
        images: Array<{ id: string; position: number; url: string }>;
        publishedAt: string;
      };
      author: { biography: string | null; achievements: unknown[]; slug: string };
      relatedWorks: Array<{ work: { publicId: string } }>;
    };
    expect(detailBody.work).toMatchObject({
      title: 'Published ceramic bowl',
      story: publishedStory,
      year: 2024,
      uniqueness: 'published-unique',
      materials: 'Published material',
      categoryId: fixture.categoryId,
      publishedAt: '2026-09-01T00:00:00.000Z',
    });
    expect(detailBody.work.images).toEqual([
      expect.objectContaining({
        id: publishedWorkImage!.id,
        position: 0,
        url: `/api/images/${publishedWorkImage!.id}`,
      }),
    ]);
    expect(detailBody.work.story?.includes('PARENT_STORY_MARKER')).toBe(false);
    expect(detailBody.author.slug).toBe(author.slug);
    expect(detailBody.author.biography?.includes('BIOGRAPHY_MARKER')).toBe(true);
    expect(detailBody.author.achievements).toHaveLength(8);
    expect(detailBody.relatedWorks.map((item) => item.work.publicId)).toEqual([
      existing.publicId,
    ]);

    const oldest = await guest.get(
      `/works?author=${author.slug}&sort=oldest&limit=10`,
    );
    const newest = await guest.get(
      `/works?author=${author.slug}&sort=newest&limit=10`,
    );
    expect(oldest.status).toBe(200);
    expect(newest.status).toBe(200);
    const oldestIds = (
      (await oldest.json()) as { works: Array<{ work: { publicId: string } }> }
    ).works.map((item) => item.work.publicId);
    const newestIds = (
      (await newest.json()) as { works: Array<{ work: { publicId: string } }> }
    ).works.map((item) => item.work.publicId);
    expect(oldestIds).toEqual([existing.publicId, publicId]);
    expect(newestIds).toEqual([publicId, existing.publicId]);

    const home = await guest.get('/portfolio/home');
    expect(home.status).toBe(200);
    const homeIds = (
      (await home.json()) as { newWorks: Array<{ work: { publicId: string } }> }
    ).newWorks.map((item) => item.work.publicId);
    expect(homeIds.slice(0, 2)).toEqual([publicId, existing.publicId]);

    const publishedResponse = await guest.get(`/images/${publishedWorkImage!.id}`);
    expect(publishedResponse.status).toBe(200);
    expect(publishedResponse.headers.get('content-type')).toMatch(/^image\/png/);
    expect(publishedResponse.headers.get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    );
    expect(Buffer.from(await publishedResponse.arrayBuffer())).toEqual(
      permissionImage,
    );
    expect((await guest.get(`/images/${pendingImage!.id}`)).status).toBe(404);
    expect((await guest.get(`/images/${parentOnlyImage!.id}`)).status).toBe(404);
    expect((await stranger.get(`/images/${pendingImage!.id}`)).status).toBe(404);
    expect((await guest.get(`/images/${randomUUID()}`)).status).toBe(404);

    const ownerPending = await owner.get(`/images/${pendingImage!.id}`);
    expect(ownerPending.status).toBe(200);
    expect(ownerPending.headers.get('cache-control')).toBe('private, no-store');
    expect(Buffer.from(await ownerPending.arrayBuffer())).toEqual(permissionImage);
    const adminPending = await adminClient.get(`/images/${pendingImage!.id}`);
    expect(adminPending.status).toBe(200);
    expect(adminPending.headers.get('cache-control')).toBe('private, no-store');
    expect(Buffer.from(await adminPending.arrayBuffer())).toEqual(permissionImage);

    const narrowImage = await prisma.productImage.findUnique({
      where: { id: publishedWorkImage!.id },
      select: productImageAuthorizationSelect,
    });
    const wideImage = await prisma.productImage.findUnique({
      where: { id: publishedWorkImage!.id },
      select: baselineProductImageAuthorizationSelect,
    });
    const narrowImageBytes = Buffer.byteLength(JSON.stringify(narrowImage));
    const wideImageBytes = Buffer.byteLength(JSON.stringify(wideImage));
    expect(narrowImageBytes).toBeLessThan(wideImageBytes);
    expect(wideImageBytes - narrowImageBytes).toBeGreaterThan(80_000);
    expect(JSON.stringify(narrowImage).includes('BIOGRAPHY_MARKER')).toBe(false);
    expect(JSON.stringify(narrowImage).includes('ACHIEVEMENT_MARKER')).toBe(false);
    expect(JSON.stringify(wideImage).includes('BIOGRAPHY_MARKER')).toBe(true);

    const narrowWork = await prisma.product.findUnique({
      where: { id: work.id },
      select: portfolioCatalogProductSelect,
    });
    const wideWork = await prisma.product.findUnique({
      where: { id: work.id },
      select: baselinePortfolioCatalogProductSelect,
    });
    const narrowWorkBytes = Buffer.byteLength(JSON.stringify(narrowWork));
    const wideWorkBytes = Buffer.byteLength(JSON.stringify(wideWork));
    expect(narrowWorkBytes).toBeLessThan(wideWorkBytes);
    expect(wideWorkBytes - narrowWorkBytes).toBeGreaterThan(50_000);
    expect(JSON.stringify(narrowWork).includes('PARENT_STORY_MARKER')).toBe(false);
    expect(JSON.stringify(narrowWork).includes(parentOnlyImage!.id)).toBe(false);
    expect(JSON.stringify(wideWork).includes('PARENT_STORY_MARKER')).toBe(true);
    expect(JSON.stringify(narrowWork).includes(publishedWorkImage!.id)).toBe(true);

    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: { status: 'SUSPENDED' },
    });
    expect((await guest.get(`/works/${publicId}`)).status).toBe(404);
    expect((await guest.get(`/images/${publishedWorkImage!.id}`)).status).toBe(404);
    const ownerSuspended = await owner.get(`/images/${publishedWorkImage!.id}`);
    expect(ownerSuspended.status).toBe(200);
    expect(ownerSuspended.headers.get('cache-control')).toBe('private, no-store');

    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: { status: 'APPROVED' },
    });
    await prisma.product.update({
      where: { id: work.id },
      data: { status: 'ARCHIVED' },
    });
    expect((await guest.get(`/works/${publicId}`)).status).toBe(404);
    expect((await guest.get(`/images/${publishedWorkImage!.id}`)).status).toBe(404);
    const ownerHidden = await owner.get(`/images/${publishedWorkImage!.id}`);
    expect(ownerHidden.status).toBe(200);
    expect(ownerHidden.headers.get('cache-control')).toBe('private, no-store');
  });
});

const baselineProductImageAuthorizationSelect = {
  id: true,
  mimeType: true,
  revisions: { select: { revisionId: true } },
  product: {
    select: {
      status: true,
      publishedRevisionId: true,
      sellerProfile: {
        select: {
          userId: true,
          status: true,
          ...publicSellerProfileSelect,
        },
      },
    },
  },
} satisfies Prisma.ProductImageSelect;

const baselinePortfolioCatalogProductSelect = {
  id: true,
  publicId: true,
  sellerProfileId: true,
  categoryId: true,
  title: true,
  story: true,
  technique: true,
  materials: true,
  dimensions: true,
  weight: true,
  year: true,
  condition: true,
  uniqueness: true,
  provenance: true,
  city: true,
  packaging: true,
  deliveryInfo: true,
  creationIntro: true,
  publishedAt: true,
  status: true,
  editingRevisionId: true,
  publishedRevisionId: true,
  createdAt: true,
  updatedAt: true,
  sellerProfile: { select: publicSellerProfileSelect },
  images: {
    orderBy: { position: 'asc' as const },
    select: productImageMetadataSelect,
  },
  publishedRevision: { select: productRevisionGallerySelect },
} satisfies Prisma.ProductSelect;

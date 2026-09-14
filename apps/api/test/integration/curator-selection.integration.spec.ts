import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
  fixturePasswordHash,
  resetPermissionFixture,
} from './permission-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

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

async function login(client: HttpTestClient, email: string, password: string) {
  const response = await client.post('/auth/login', { email, password });
  expect(response.status).toBe(201);
}

describe('admin curator selection HTTP', () => {
  it('returns a visible pick and hides unpublished, rejected, or missing pointers', async () => {
    const fixture = await createPermissionFixture(prisma);
    const admin = await prisma.user.create({
      data: {
        email: `admin.curator.${fixture.categoryId.slice(0, 8)}@wave3.test`,
        passwordHash: fixturePasswordHash,
        displayName: 'Curator admin',
        role: 'admin',
      },
      select: { email: true },
    });
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const adminClient = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const stranger = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    await login(
      owner,
      fixture.sellers.approved.email,
      fixture.sellers.approved.password,
    );
    await login(adminClient, admin.email, 'password123');
    await login(
      stranger,
      fixture.sellers.otherApproved.email,
      fixture.sellers.otherApproved.password,
    );

    const emptyHome = await guest.get('/portfolio/home');
    expect(emptyHome.status).toBe(200);
    expect(
      ((await emptyHome.json()) as { curatorSelection: unknown }).curatorSelection,
    ).toBeNull();

    const approved = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.approvedProductId },
      select: { publicId: true, id: true },
    });
    const draft = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.approvedDraftProductId },
      select: { publicId: true },
    });
    const [ownerProfile, curatorProfile, pendingProfile] = await Promise.all([
      prisma.sellerProfile.findUniqueOrThrow({
        where: { id: fixture.sellers.approved.profileId },
        select: { slug: true },
      }),
      prisma.sellerProfile.findUniqueOrThrow({
        where: { id: fixture.sellers.otherApproved.profileId },
        select: { slug: true },
      }),
      prisma.sellerProfile.findUniqueOrThrow({
        where: { id: fixture.sellers.pending.profileId },
        select: { slug: true },
      }),
    ]);

    expect(
      (await stranger.put('/admin/curator-selection', {
        publicId: approved.publicId,
        curatorSlug: curatorProfile.slug,
        note: null,
      }))
        .status,
    ).toBe(403);
    expect(
      (await guest.put('/admin/curator-selection', {
        publicId: approved.publicId,
        curatorSlug: curatorProfile.slug,
        note: null,
      }))
        .status,
    ).toBe(401);
    expect(
      (
        await adminClient.put('/admin/curator-selection', {
          publicId: approved.publicId,
        })
      ).status,
    ).toBe(400);

    const selected = await adminClient.put('/admin/curator-selection', {
      publicId: approved.publicId,
      curatorSlug: curatorProfile.slug,
      note: null,
    });
    expect(selected.status).toBe(200);
    expect(await selected.json()).toMatchObject({
      publicId: approved.publicId,
      productId: approved.id,
      curatorSlug: curatorProfile.slug,
      note: null,
    });

    const visibleHome = await guest.get('/portfolio/home');
    expect(visibleHome.status).toBe(200);
    expect(
      ((await visibleHome.json()) as {
        curatorSelection: {
          curator: { slug: string };
          work: { publicId: string; author: { slug: string } };
          note: string | null;
        };
      }).curatorSelection,
    ).toMatchObject({
      curator: { slug: curatorProfile.slug },
      work: {
        publicId: approved.publicId,
        author: { slug: ownerProfile.slug },
      },
      note: null,
    });
    expect(curatorProfile.slug).not.toBe(ownerProfile.slug);

    const withNote = await adminClient.put('/admin/curator-selection', {
      publicId: approved.publicId,
      curatorSlug: curatorProfile.slug,
      note: 'Главная визуальная находка этой недели.',
    });
    expect(withNote.status).toBe(200);
    expect(await withNote.json()).toMatchObject({
      note: 'Главная визуальная находка этой недели.',
      curatorSlug: curatorProfile.slug,
    });
    expect(
      ((await (await guest.get('/portfolio/home')).json()) as {
        curatorSelection: { note: string | null };
      }).curatorSelection.note,
    ).toBe('Главная визуальная находка этой недели.');
    expect(
      (
        await adminClient.put('/admin/curator-selection', {
          publicId: draft.publicId,
          curatorSlug: curatorProfile.slug,
          note: null,
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await adminClient.put('/admin/curator-selection', {
          publicId: approved.publicId,
          curatorSlug: pendingProfile.slug,
          note: null,
        })
      ).status,
    ).toBe(409);

    expect((await owner.post(`/products/${approved.id}/hide`)).status).toBe(201);
    const hiddenHome = await guest.get('/portfolio/home');
    expect(hiddenHome.status).toBe(200);
    expect(
      ((await hiddenHome.json()) as { curatorSelection: unknown }).curatorSelection,
    ).toBeNull();

    expect((await owner.post(`/products/${approved.id}/unhide`)).status).toBe(
      201,
    );
    const restoredHome = await guest.get('/portfolio/home');
    expect(
      ((await restoredHome.json()) as { curatorSelection: { work: { publicId: string } } })
        .curatorSelection.work.publicId,
    ).toBe(approved.publicId);

    expect((await adminClient.delete('/admin/curator-selection')).status).toBe(
      200,
    );
    const clearedHome = await guest.get('/portfolio/home');
    expect(
      ((await clearedHome.json()) as { curatorSelection: unknown }).curatorSelection,
    ).toBeNull();
  });
});

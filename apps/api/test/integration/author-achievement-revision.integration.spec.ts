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
  permissionImage,
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
  http = await createHttpTestApp(database.databaseUrl, 'http://localhost:8081');
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

function achievementForm(body: string, withImage = false) {
  const form = new FormData();
  form.set('body', body);
  if (withImage) {
    form.append(
      'image',
      new Blob([permissionImage], { type: 'image/png' }),
      'show.png',
    );
  }
  return form;
}

type PublicAchievement = { id: string; body: string };

async function publicAchievements(client: HttpTestClient, slug: string) {
  const response = await client.get(`/authors/${slug}`);
  expect(response.status).toBe(200);
  const body = (await response.json()) as {
    author: { achievements: PublicAchievement[] };
  };
  return body.author.achievements;
}

describe('author achievement editing revision HTTP contract', () => {
  it('forks approved add/delete onto a draft and publishes only after approve', async () => {
    const fixture = await createPermissionFixture(prisma);
    const author = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: {
        slug: true,
        publishedRevisionId: true,
        profilePhotoMimeType: true,
        profilePhotoByteLength: true,
        profilePhotoChecksum: true,
        profilePhotoObjectKey: true,
      },
    });
    expect(author.publishedRevisionId).toBeTruthy();
    await prisma.sellerProfileRevision.update({
      where: { id: author.publishedRevisionId! },
      data: {
        profilePhotoMimeType: author.profilePhotoMimeType,
        profilePhotoByteLength: author.profilePhotoByteLength,
        profilePhotoChecksum: author.profilePhotoChecksum,
        profilePhotoObjectKey:
          author.profilePhotoObjectKey ??
          `seller-photo:${fixture.sellers.approved.profileId}`,
      },
    });
    await prisma.sellerProfileRevisionAchievement.create({
      data: {
        revisionId: author.publishedRevisionId!,
        position: 0,
        body: 'Original show',
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: `admin.achievements.${fixture.categoryId.slice(0, 8)}@wave3.test`,
        passwordHash: fixturePasswordHash,
        displayName: 'Achievement admin',
        role: 'admin',
      },
      select: { email: true },
    });
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const adminClient = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
    );
    await login(
      owner,
      fixture.sellers.approved.email,
      fixture.sellers.approved.password,
    );
    await login(adminClient, admin.email, 'password123');

    const publishedBefore = await publicAchievements(guest, author.slug);
    expect(publishedBefore.map((item) => item.body)).toEqual(['Original show']);
    const publishedId = publishedBefore[0]!.id;

    const deleted = await owner.delete(
      `/author/application/achievements/${publishedId}`,
    );
    expect(deleted.status).toBe(200);
    expect(
      (await publicAchievements(guest, author.slug)).map((item) => item.body),
    ).toEqual(['Original show']);
    expect(
      await prisma.sellerProfileRevisionAchievement.findUnique({
        where: { id: publishedId },
        select: { body: true },
      }),
    ).toEqual({ body: 'Original show' });

    const profileAfterDelete = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: {
        publishedRevisionId: true,
        editingRevisionId: true,
        editingRevision: { select: { status: true } },
      },
    });
    expect(profileAfterDelete.editingRevisionId).not.toBe(
      profileAfterDelete.publishedRevisionId,
    );
    expect(profileAfterDelete.editingRevision?.status).toBe('DRAFT');
    expect(
      (await owner.delete(`/author/application/achievements/${publishedId}`))
        .status,
    ).toBe(404);

    const added = await owner.post(
      '/author/application/achievements',
      achievementForm('Added show', true),
    );
    expect(added.status).toBe(201);
    const addedId = ((await added.json()) as { achievement: { id: string } })
      .achievement.id;
    expect(addedId).not.toBe(publishedId);
    expect(
      (await publicAchievements(guest, author.slug)).map((item) => item.body),
    ).toEqual(['Original show']);
    expect(
      (await guest.get(`/author-achievements/${addedId}/image`)).status,
    ).toBe(404);
    expect(
      (await owner.get(`/author-achievements/${addedId}/image`)).status,
    ).toBe(200);

    expect((await owner.post('/author/application/submit')).status).toBe(201);
    expect(
      (await publicAchievements(guest, author.slug)).map((item) => item.body),
    ).toEqual(['Original show']);
    expect(
      (
        await adminClient.patch(
          `/admin/seller-profiles/${fixture.sellers.approved.profileId}/status`,
          { status: 'APPROVED' },
        )
      ).status,
    ).toBe(200);

    const publishedAfter = await publicAchievements(guest, author.slug);
    expect(publishedAfter.map((item) => item.body)).toEqual(['Added show']);
    expect(publishedAfter[0]!.id).toBe(addedId);
    expect(
      (await guest.get(`/author-achievements/${addedId}/image`)).status,
    ).toBe(200);
  });

  it('rejects achievement writes while a revision is pending review', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(
      owner,
      fixture.sellers.pending.email,
      fixture.sellers.pending.password,
    );

    const added = await owner.post(
      '/author/application/achievements',
      achievementForm('Too early'),
    );
    expect(added.status).toBe(409);

    await prisma.sellerProfileRevisionAchievement.create({
      data: {
        revisionId: (
          await prisma.sellerProfile.findUniqueOrThrow({
            where: { id: fixture.sellers.pending.profileId },
            select: { editingRevisionId: true },
          })
        ).editingRevisionId!,
        position: 0,
        body: 'Pending show',
      },
    });
    const pendingAchievement =
      await prisma.sellerProfileRevisionAchievement.findFirstOrThrow({
        where: {
          revision: { sellerProfileId: fixture.sellers.pending.profileId },
        },
        select: { id: true },
      });
    expect(
      (
        await owner.delete(
          `/author/application/achievements/${pendingAchievement.id}`,
        )
      ).status,
    ).toBe(409);
  });
});

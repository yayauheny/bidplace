import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import { bootstrapCatalog } from '../../src/catalog/catalog-bootstrap';
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
import { productModerationRequest } from './admin-status-request';
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

afterEach(async () => {
  await resetPermissionFixture(prisma);
});

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

async function login(client: HttpTestClient, email: string) {
  const response = await client.post('/auth/login', {
    email,
    password: 'password123',
  });
  expect(response.status).toBe(201);
}

async function user(role: 'user' | 'admin' = 'user') {
  const email = `${role}-${randomUUID().slice(0, 8)}@story.test`;
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash: fixturePasswordHash,
      displayName: role,
      role,
      emailVerifiedAt: new Date('2026-10-11T12:00:00.000Z'),
    },
    select: { id: true, email: true },
  });
  const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
  await login(client, created.email);
  return { ...created, client };
}

async function authorWithoutCity() {
  const owner = await user();
  const painting = await prisma.category.findUniqueOrThrow({
    where: { slug: 'painting' },
  });
  const profile = await prisma.sellerProfile.create({
    data: {
      userId: owner.id,
      slug: `author-${randomUUID().slice(0, 8)}`,
      sellerType: 'creator',
      fullName: 'Author without city',
      country: 'BY',
      city: null,
      shortDescription: 'Works without a city',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: permissionImage.byteLength,
      profilePhotoChecksum: 'c'.repeat(64),
      profilePhotoData: permissionImage,
      status: 'APPROVED',
    },
  });
  const revision = await prisma.sellerProfileRevision.create({
    data: {
      sellerProfileId: profile.id,
      version: 1,
      status: 'APPROVED',
      slug: profile.slug,
      fullName: profile.fullName,
      country: 'BY',
      city: null,
      shortDescription: profile.shortDescription,
      directions: { create: { categoryId: painting.id, position: 0 } },
    },
  });
  await prisma.sellerProfile.update({
    where: { id: profile.id },
    data: {
      editingRevisionId: revision.id,
      publishedRevisionId: revision.id,
    },
  });
  return { owner, profile, painting };
}

async function draftWork(
  ownerId: string,
  profileId: string,
  title: string,
  categoryId: string,
) {
  const product = await prisma.product.create({
    data: {
      sellerProfileId: profileId,
      publicId: `w${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      categoryId,
      title,
      status: 'DRAFT',
    },
  });
  const revision = await prisma.productRevision.create({
    data: {
      productId: product.id,
      version: 1,
      status: 'DRAFT',
      categoryId,
      title,
    },
  });
  const image = await prisma.productImage.create({
    data: {
      productId: product.id,
      position: 0,
      mimeType: 'image/png',
      byteLength: permissionImage.byteLength,
      data: permissionImage,
      checksum: 'd'.repeat(64),
    },
  });
  await prisma.productRevisionImage.create({
    data: { revisionId: revision.id, imageId: image.id, position: 0 },
  });
  await prisma.product.update({
    where: { id: product.id },
    data: { editingRevisionId: revision.id },
  });
  return { product, revision, image };
}

async function storyAsset(ownerId: string, revisionId: string) {
  const asset = await prisma.mediaAsset.create({
    data: {
      ownerUserId: ownerId,
      purpose: 'STORY_IMAGE',
      state: 'READY',
      objects: {
        create: {
          variant: 'SOURCE',
          tier: 'PRIVATE',
          pipelineVersion: 'source',
          objectKey: `story/${randomUUID()}`,
          mimeType: 'image/png',
          byteLength: 128,
          sha256: 'e'.repeat(64),
          width: 10,
          height: 10,
          state: 'READY',
        },
      },
    },
  });
  await prisma.productRevisionStoryAsset.create({
    data: { revisionId, mediaAssetId: asset.id },
  });
  return asset;
}

describe('author story, catalog, and proposals', () => {
  it('bootstraps starter dictionaries without overwriting admin edits', async () => {
    await bootstrapCatalog(prisma as never);
    const before = await prisma.category.findUniqueOrThrow({
      where: { slug: 'painting' },
    });
    await prisma.category.update({
      where: { id: before.id },
      data: { name: 'Живопись автора', active: false },
    });
    const termsBefore = await prisma.catalogTerm.count();
    await bootstrapCatalog(prisma as never);
    const after = await prisma.category.findUniqueOrThrow({
      where: { slug: 'painting' },
    });
    expect(after.id).toBe(before.id);
    expect(after.name).toBe('Живопись автора');
    expect(after.active).toBe(false);
    expect(await prisma.category.count()).toBeGreaterThanOrEqual(18);
    expect(await prisma.catalogTerm.count()).toBe(termsBefore);
    const countries = await new HttpTestClient(http.baseUrl).get(
      '/countries?q=бел',
    );
    expect(countries.status).toBe(200);
    expect(await countries.json()).toEqual(
      expect.objectContaining({
        countries: expect.arrayContaining([
          expect.objectContaining({ code: 'BY' }),
        ]),
      }),
    );
  });

  it('lists an approved author without a city and filters by direction and term ids', async () => {
    await bootstrapCatalog(prisma as never);
    const { owner, profile, painting } = await authorWithoutCity();
    const canvas = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'MATERIAL', slug: 'canvas' } },
    });
    const sculpture = await prisma.category.findUniqueOrThrow({
      where: { slug: 'sculpture' },
    });
    const first = await draftWork(
      owner.id,
      profile.id,
      'Cityless work',
      painting.id,
    );
    const second = await draftWork(
      owner.id,
      profile.id,
      'Second work',
      painting.id,
    );
    for (const work of [first, second]) {
      await prisma.productRevisionTerm.create({
        data: { revisionId: work.revision.id, termId: canvas.id },
      });
      await prisma.productRevision.update({
        where: { id: work.revision.id },
        data: { status: 'APPROVED' },
      });
      await prisma.product.update({
        where: { id: work.product.id },
        data: {
          status: 'APPROVED',
          publishedAt: new Date(),
          publishedRevisionId: work.revision.id,
        },
      });
    }
    const guest = new HttpTestClient(http.baseUrl);
    const author = await guest.get(`/authors/${profile.slug}`);
    expect(author.status).toBe(200);
    expect(
      ((await author.json()) as { author: { city: string | null } }).author
        .city,
    ).toBeNull();
    const byDirection = await guest.get(`/authors?directionId=${painting.id}`);
    expect(byDirection.status).toBe(200);
    const authors = (
      (await byDirection.json()) as {
        authors: Array<{ author: { slug: string } }>;
      }
    ).authors.map((item) => item.author.slug);
    expect(authors).toContain(profile.slug);
    const otherDirection = await guest.get(
      `/authors?directionId=${sculpture.id}`,
    );
    expect(
      (
        (await otherDirection.json()) as {
          authors: Array<{ author: { slug: string } }>;
        }
      ).authors.map((item) => item.author.slug),
    ).not.toContain(profile.slug);
    const page = await guest.get(
      `/works?materialId=${canvas.id}&limit=1&page=1`,
    );
    const next = await guest.get(
      `/works?materialId=${canvas.id}&limit=1&page=2`,
    );
    expect(page.status).toBe(200);
    const firstPage = (await page.json()) as {
      works: Array<{ product: { publicId: string } }>;
      pagination: { total: number };
    };
    const secondPage = (await next.json()) as {
      works: Array<{ product: { publicId: string } }>;
    };
    expect(firstPage.pagination.total).toBe(2);
    expect(firstPage.works).toHaveLength(1);
    expect(secondPage.works).toHaveLength(1);
    expect(firstPage.works[0]?.work.publicId).not.toBe(
      secondPage.works[0]?.work.publicId,
    );
    const wrongRole = await owner.client.patch(`/products/${first.product.id}`, {
      techniqueTermIds: [canvas.id],
    });
    expect(wrongRole.status).toBe(409);
  });

  it('saves, rejects stale snapshots, and clones an independent story', async () => {
    await bootstrapCatalog(prisma as never);
    const { owner, profile, painting } = await authorWithoutCity();
    const work = await draftWork(owner.id, profile.id, 'Story work', painting.id);
    const asset = await storyAsset(owner.id, work.revision.id);
    const saved = await owner.client.put(`/products/${work.product.id}/creation`, {
      storyToken: 0,
      idempotencyKey: 'story-1',
      blocks: [
        { type: 'PARAGRAPH', text: 'Сначала текст' },
        { type: 'IMAGE', mediaAssetId: asset.id, altText: 'Эскиз' },
      ],
    });
    expect(saved.status).toBe(200);
    const story = (await saved.json()) as {
      storyToken: number;
      blocks: Array<{ id: string; type: string; position: number }>;
    };
    expect(story.blocks.map((block) => block.type)).toEqual([
      'PARAGRAPH',
      'IMAGE',
    ]);
    expect(story.blocks.map((block) => block.position)).toEqual([0, 1]);
    const retry = await owner.client.put(`/products/${work.product.id}/creation`, {
      storyToken: 0,
      idempotencyKey: 'story-1',
      blocks: [{ type: 'HEADING', text: 'Другой текст' }],
    });
    expect(retry.status).toBe(200);
    expect(
      ((await retry.json()) as { blocks: Array<{ id: string }> }).blocks.map(
        (block) => block.id,
      ),
    ).toEqual(story.blocks.map((block) => block.id));
    const stale = await owner.client.put(`/products/${work.product.id}/creation`, {
      storyToken: 0,
      blocks: [{ type: 'HEADING', text: 'Устаревший снимок' }],
    });
    expect(stale.status).toBe(409);
    const imagesOnly = await owner.client.put(
      `/products/${work.product.id}/creation`,
      {
        storyToken: story.storyToken,
        blocks: [{ type: 'IMAGE', mediaAssetId: asset.id }],
      },
    );
    expect(imagesOnly.status).toBe(200);
    await prisma.productRevision.update({
      where: { id: work.revision.id },
      data: { status: 'APPROVED' },
    });
    await prisma.product.update({
      where: { id: work.product.id },
      data: {
        status: 'APPROVED',
        publishedAt: new Date(),
        publishedRevisionId: work.revision.id,
      },
    });
    const published = await new HttpTestClient(http.baseUrl).get(
      `/works/${work.product.publicId}`,
    );
    expect(published.status).toBe(200);
    const publishedStory = (
      (await published.json()) as {
        work: { creationStory: { blocks: Array<{ id: string }> } };
      }
    ).work.creationStory;
    expect(publishedStory.blocks).toHaveLength(1);
    const fork = await owner.client.patch(`/products/${work.product.id}`, {
      title: 'Revised story work',
    });
    expect(fork.status).toBe(200);
    const cloned = await prisma.product.findUniqueOrThrow({
      where: { id: work.product.id },
      select: {
        publishedRevisionId: true,
        editingRevision: { select: { id: true, storyBlocks: true } },
      },
    });
    expect(cloned.editingRevision?.id).not.toBe(work.revision.id);
    expect(cloned.publishedRevisionId).toBe(work.revision.id);
    expect(cloned.editingRevision?.storyBlocks[0]?.id).not.toBe(
      publishedStory.blocks[0]?.id,
    );
    expect(cloned.editingRevision?.storyBlocks[0]?.mediaAssetId).toBe(asset.id);
    const unchanged = await new HttpTestClient(http.baseUrl).get(
      `/works/${work.product.publicId}`,
    );
    expect(
      (
        (await unchanged.json()) as {
          work: { creationStory: { blocks: Array<{ id: string }> } };
        }
      ).work.creationStory.blocks[0]?.id,
    ).toBe(publishedStory.blocks[0]?.id);
  });

  it('blocks publication until a proposal is mapped and returns a rejected proposal for changes', async () => {
    await bootstrapCatalog(prisma as never);
    const { owner, profile, painting } = await authorWithoutCity();
    const admin = await user('admin');
    const outsider = await user();
    const other = await prisma.category.findUniqueOrThrow({
      where: { slug: 'other' },
    });
    const work = await draftWork(owner.id, profile.id, 'Proposed work', other.id);
    const proposed = await owner.client.patch(`/products/${work.product.id}`, {
      categoryId: other.id,
      categoryProposal: '  Цифровой  рельеф ',
      materialProposals: ['Неизвестный холст'],
    });
    expect(proposed.status).toBe(200);
    const proposals = await prisma.catalogProposal.findMany({
      where: { productRevisionId: work.revision.id },
    });
    expect(proposals.map((item) => item.normalizedName).sort()).toEqual([
      'неизвестный холст',
      'цифровой рельеф',
    ]);
    expect((await owner.client.post(`/products/${work.product.id}/submit`)).status).toBe(
      201,
    );
    const categoryProposal = proposals.find((item) => item.kind === 'CATEGORY');
    const blocked = await admin.client.patch(
      `/admin/products/${work.product.id}/status`,
      await productModerationRequest(prisma, work.product.id, 'APPROVED'),
    );
    expect(blocked.status).toBe(409);
    expect(
      (await outsider.client.post(
        `/admin/catalog/proposals/${categoryProposal!.id}/map`,
        { categoryId: painting.id },
      )).status,
    ).toBe(403);
    const mapped = await admin.client.post(
      `/admin/catalog/proposals/${categoryProposal!.id}/map`,
      { categoryId: painting.id },
    );
    expect(mapped.status).toBe(201);
    const again = await admin.client.post(
      `/admin/catalog/proposals/${categoryProposal!.id}/map`,
      { categoryId: painting.id },
    );
    expect(again.status).toBe(409);
    const material = proposals.find((item) => item.kind === 'MATERIAL')!;
    const rejected = await admin.client.post(
      `/admin/catalog/proposals/${material.id}/reject`,
      { reason: 'Уточните материал' },
    );
    expect(rejected.status).toBe(201);
    const returned = await prisma.product.findUniqueOrThrow({
      where: { id: work.product.id },
      select: { status: true, editingRevision: { select: { status: true } } },
    });
    expect(returned.status).toBe('CHANGES_REQUESTED');
    expect(returned.editingRevision?.status).toBe('CHANGES_REQUESTED');
    const cleared = await owner.client.patch(`/products/${work.product.id}`, {
      materialProposals: [],
    });
    expect(cleared.status, await cleared.text()).toBe(200);
    expect(
      await prisma.catalogProposal.findUniqueOrThrow({
        where: { id: material.id },
        select: { selected: true, status: true },
      }),
    ).toEqual({ selected: false, status: 'REJECTED' });
    expect((await owner.client.post(`/products/${work.product.id}/submit`)).status).toBe(
      201,
    );
    const [first, second] = await Promise.all([
      admin.client.post('/admin/catalog/terms', {
        role: 'MATERIAL',
        name: 'Речной песок',
      }),
      admin.client.post('/admin/catalog/terms', {
        role: 'MATERIAL',
        name: 'Речной песок',
      }),
    ]);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const firstTerm = ((await first.json()) as { term: { id: string } }).term.id;
    const secondTerm = ((await second.json()) as { term: { id: string } }).term.id;
    expect(firstTerm).toBe(secondTerm);
  });
});

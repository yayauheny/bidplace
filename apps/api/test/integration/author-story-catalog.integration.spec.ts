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
  const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081', created.id);
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
    const excluded = await draftWork(
      owner.id,
      profile.id,
      'Work without canvas',
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
    await prisma.productRevision.update({
      where: { id: excluded.revision.id },
      data: { status: 'APPROVED' },
    });
    await prisma.product.update({
      where: { id: excluded.product.id },
      data: {
        status: 'APPROVED',
        publishedAt: new Date(),
        publishedRevisionId: excluded.revision.id,
      },
    });
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
    const exactRetry = await owner.client.put(`/products/${work.product.id}/creation`, {
      storyToken: story.storyToken,
      idempotencyKey: 'story-1',
      blocks: [
        { id: story.blocks[0]?.id, type: 'PARAGRAPH', text: 'Сначала текст' },
        {
          id: story.blocks[1]?.id,
          type: 'IMAGE',
          mediaAssetId: asset.id,
          altText: 'Эскиз',
        },
      ],
    });
    expect(exactRetry.status).toBe(200);
    expect(
      ((await exactRetry.json()) as { storyToken: number }).storyToken,
    ).toBe(story.storyToken);
    const changedKey = await owner.client.put(`/products/${work.product.id}/creation`, {
      storyToken: story.storyToken,
      idempotencyKey: 'story-1',
      blocks: [{ type: 'HEADING', text: 'Другой текст' }],
    });
    expect(changedKey.status).toBe(409);
    expect(
      (
        await prisma.productRevisionStoryBlock.findMany({
          where: { revisionId: work.revision.id },
          orderBy: { position: 'asc' },
        })
      ).map((block) => block.id),
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
    const draftStory = await owner.client.put(
      `/products/${work.product.id}/creation`,
      {
        storyToken: 0,
        blocks: [{ type: 'PARAGRAPH', text: 'Черновая история' }],
      },
    );
    expect(draftStory.status, await draftStory.text()).toBe(200);
    const stillPublished = await new HttpTestClient(http.baseUrl).get(
      `/works/${work.product.publicId}`,
    );
    expect(
      (
        (await stillPublished.json()) as {
          work: { creationStory: { blocks: Array<{ id: string }> } };
        }
      ).work.creationStory.blocks.map((block) => block.id),
    ).toEqual([publishedStory.blocks[0]?.id]);
    const ownerView = await owner.client.get(`/seller/products/${work.product.id}`);
    expect(ownerView.status).toBe(200);
    expect(
      (
        (await ownerView.json()) as {
          story: { blocks: Array<{ text?: string }> };
        }
      ).story.blocks[0]?.text,
    ).toBe('Черновая история');
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

  it('keeps one catalog identity, country list, and hidden selections', async () => {
    await bootstrapCatalog(prisma as never);
    const admin = await user('admin');
    const { owner } = await authorWithoutCity();
    const canvas = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'MATERIAL', slug: 'canvas' } },
    });
    const roman = await admin.client.post('/admin/categories', { name: 'Ⅰ' });
    expect(roman.status).toBe(201);
    const romanCategory = ((await roman.json()) as { category: { id: string } }).category;
    const latin = await admin.client.post('/admin/categories', { name: 'I' });
    expect(latin.status).toBe(201);
    expect(((await latin.json()) as { category: { id: string } }).category.id).toBe(
      romanCategory.id,
    );
    expect(
      await prisma.category.count({ where: { normalizedName: 'i' } }),
    ).toBe(1);
    const created = await admin.client.post('/admin/catalog/terms', {
      role: 'MATERIAL',
      name: '  ХОЛСТ  ',
    });
    expect(created.status).toBe(201);
    expect(((await created.json()) as { term: { id: string } }).term.id).toBe(canvas.id);
    expect(
      await prisma.catalogTerm.count({
        where: { role: 'MATERIAL', normalizedName: 'холст' },
      }),
    ).toBe(1);
    const otherRole = await admin.client.post('/admin/catalog/terms', {
      role: 'TECHNIQUE',
      name: 'Холст',
    });
    expect(otherRole.status).toBe(201);
    expect(((await otherRole.json()) as { term: { id: string } }).term.id).not.toBe(
      canvas.id,
    );
    const renamed = await admin.client.patch(`/admin/catalog/terms/${canvas.id}`, {
      name: 'Кожа',
    });
    expect(renamed.status).toBe(409);
    await prisma.catalogTerm.update({
      where: { id: canvas.id },
      data: { name: 'Холст автора', active: false },
    });
    await bootstrapCatalog(prisma as never);
    const preserved = await prisma.catalogTerm.findUniqueOrThrow({
      where: { id: canvas.id },
    });
    expect(preserved.name).toBe('Холст автора');
    expect(preserved.active).toBe(false);
    const countries = await new HttpTestClient(http.baseUrl).get('/countries');
    const codes = (
      (await countries.json()) as { countries: Array<{ code: string }> }
    ).countries.map((item) => item.code);
    const { isCountryCode } = await import('@bidplace/contracts');
    expect(codes.every((code) => isCountryCode(code))).toBe(true);
    expect(['EU', 'UN', 'UK'].some((code) => codes.includes(code))).toBe(false);
    expect((await owner.client.patch('/seller/profile', { country: 'EU' })).status).toBe(400);
    expect((await owner.client.patch('/seller/profile', { country: 'UK' })).status).toBe(400);
    expect((await owner.client.patch('/seller/profile', { country: 'UN' })).status).toBe(400);
    expect((await owner.client.patch('/seller/profile', { country: 'GB' })).status).toBe(200);

    const painting = await prisma.category.findUniqueOrThrow({ where: { slug: 'painting' } });
    const sculpture = await prisma.category.findUniqueOrThrow({ where: { slug: 'sculpture' } });
    await prisma.category.update({ where: { id: sculpture.id }, data: { active: false } });
    const hiddenCreate = await owner.client.post('/products', {
      title: 'Hidden category',
      categoryId: sculpture.id,
    });
    expect(hiddenCreate.status).toBe(409);
    const unknown = await owner.client.post('/products', {
      title: 'Unknown category',
      categoryId: '00000000-0000-4000-8000-000000000099',
    });
    expect(unknown.status).toBe(409);
    const createdWork = await owner.client.post('/products', {
      title: 'Visible category',
      categoryId: painting.id,
    });
    expect(createdWork.status).toBe(201);
    const productId = ((await createdWork.json()) as { product: { id: string } }).product.id;
    await prisma.category.update({ where: { id: painting.id }, data: { active: false } });
    const kept = await owner.client.patch(`/products/${productId}`, {
      categoryId: painting.id,
      title: 'Still the same category',
    });
    expect(kept.status, await kept.text()).toBe(200);
    const switched = await owner.client.patch(`/products/${productId}`, {
      categoryId: sculpture.id,
    });
    expect(switched.status).toBe(409);
    await prisma.catalogTerm.update({ where: { id: canvas.id }, data: { active: true } });
    const selectedTerm = await owner.client.patch(`/products/${productId}`, {
      materialTermIds: [canvas.id],
    });
    expect(selectedTerm.status, await selectedTerm.text()).toBe(200);
    await prisma.catalogTerm.update({ where: { id: canvas.id }, data: { active: false } });
    const keptTerm = await owner.client.patch(`/products/${productId}`, {
      materialTermIds: [canvas.id],
    });
    expect(keptTerm.status, await keptTerm.text()).toBe(200);
    const hiddenTerm = await prisma.catalogTerm.create({
      data: {
        role: 'MATERIAL',
        slug: `hidden-${randomUUID().slice(0, 8)}`,
        name: 'Скрытый материал',
        normalizedName: `скрытый материал ${randomUUID().slice(0, 8)}`,
        active: false,
      },
    });
    expect(
      (await owner.client.patch(`/products/${productId}`, { materialTermIds: [hiddenTerm.id] }))
        .status,
    ).toBe(409);
    const keptDirection = await owner.client.patch('/seller/profile', {
      directionCategoryIds: [painting.id],
    });
    expect(keptDirection.status, await keptDirection.text()).toBe(200);
    expect(
      (
        await owner.client.patch('/seller/profile', {
          directionCategoryIds: [sculpture.id],
        })
      )      .status,
    ).toBe(409);
  });

  it('reads selections through the API and resolves proposals once', async () => {
    await bootstrapCatalog(prisma as never);
    const { owner, profile, painting } = await authorWithoutCity();
    const admin = await user('admin');
    const canvas = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'MATERIAL', slug: 'canvas' } },
    });
    const work = await draftWork(owner.id, profile.id, 'Selected work', painting.id);
    const saved = await owner.client.patch(`/products/${work.product.id}`, {
      materialTermIds: [canvas.id],
      materialProposals: ['Лунный грунт'],
    });
    expect(saved.status).toBe(200);
    const ownerView = await owner.client.get(`/seller/products/${work.product.id}`);
    expect(ownerView.status).toBe(200);
    const ownerBody = (await ownerView.json()) as {
      selection: {
        materialTermIds: string[];
        proposals: Array<{ id: string; rawName: string; status: string }>;
      };
    };
    expect(ownerBody.selection.materialTermIds).toEqual([canvas.id]);
    expect(ownerBody.selection.proposals[0]?.rawName).toBe('Лунный грунт');
    expect((await owner.client.post(`/products/${work.product.id}/submit`)).status).toBe(201);
    const listed = await admin.client.get('/admin/products?filter=PENDING_REVIEW');
    expect(listed.status).toBe(200);
    const adminBody = (await listed.json()) as {
      products: Array<{
        id: string;
        reviewTarget: {
          updatedAt: string;
          selection: {
            proposals: Array<{ id: string; status: string; rawName: string }>;
          };
        } | null;
      }>;
    };
    const proposal = adminBody.products
      .find((item) => item.id === work.product.id)
      ?.reviewTarget?.selection.proposals.find((item) => item.rawName === 'Лунный грунт');
    expect(proposal?.id).toBeTruthy();
    const removed = await owner.client.patch(`/products/${work.product.id}`, {
      materialProposals: [],
    });
    expect(removed.status).toBe(403);
    const pendingStory = await owner.client.put(`/products/${work.product.id}/creation`, {
      storyToken: 0,
      blocks: [{ type: 'PARAGRAPH', text: 'Нельзя' }],
    });
    expect(pendingStory.status).toBe(403);

    const [mapped, rejected] = await Promise.all([
      admin.client.post(`/admin/catalog/proposals/${proposal!.id}/map`, {
        termId: canvas.id,
      }),
      admin.client.post(`/admin/catalog/proposals/${proposal!.id}/reject`, {
        reason: 'Не тот материал',
      }),
    ]);
    const statuses = [mapped.status, rejected.status].sort();
    expect(statuses).toEqual([201, 409]);
    const decision = await prisma.catalogProposal.findUniqueOrThrow({
      where: { id: proposal!.id },
    });
    expect(decision.status).not.toBe('PENDING');
    if (decision.status === 'APPROVED') {
      expect(decision.mappedTermId).toBe(canvas.id);
      expect(
        await prisma.productRevisionTerm.count({
          where: { revisionId: work.revision.id, termId: canvas.id },
        }),
      ).toBeGreaterThan(0);
    } else {
      expect(decision.rejectionReason).toBe('Не тот материал');
      expect(decision.mappedTermId).toBeNull();
    }
    expect(
      await prisma.auditEvent.count({
        where: { targetId: work.product.id, reason: { not: null } },
      }),
    ).toBe(1);
  });

  it('reuses a removed proposal and invalidates a stale moderation target', async () => {
    await bootstrapCatalog(prisma as never);
    const { owner, profile, painting } = await authorWithoutCity();
    const admin = await user('admin');
    const work = await draftWork(owner.id, profile.id, 'Proposal reuse', painting.id);
    expect(
      (await owner.client.patch(`/products/${work.product.id}`, {
        materialProposals: ['Лунный грунт'],
      })).status,
    ).toBe(200);
    expect(
      (await owner.client.patch(`/products/${work.product.id}`, {
        materialProposals: [],
      })).status,
    ).toBe(200);
    const again = await owner.client.patch(`/products/${work.product.id}`, {
      materialProposals: ['  лунный   ГРУНТ '],
    });
    expect(again.status, await again.text()).toBe(200);
    expect(await prisma.catalogProposal.count({
      where: { productRevisionId: work.revision.id, kind: 'MATERIAL' },
    })).toBe(1);
    expect((await owner.client.post(`/products/${work.product.id}/submit`)).status).toBe(201);
    const listed = await admin.client.get('/admin/products?filter=PENDING_REVIEW');
    const target = (
      (await listed.json()) as {
        products: Array<{
          id: string;
          reviewTarget: { id: string; updatedAt: string; selection: { proposals: Array<{ id: string }> } } | null;
        }>;
      }
    ).products.find((item) => item.id === work.product.id)?.reviewTarget;
    const canvas = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'MATERIAL', slug: 'canvas' } },
    });
    const oil = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'MATERIAL', slug: 'oil' } },
    });
    const [firstMap, secondMap] = await Promise.all([
      admin.client.post(`/admin/catalog/proposals/${target!.selection.proposals[0]!.id}/map`, {
        termId: canvas.id,
      }),
      admin.client.post(`/admin/catalog/proposals/${target!.selection.proposals[0]!.id}/map`, {
        termId: oil.id,
      }),
    ]);
    expect([firstMap.status, secondMap.status].sort()).toEqual([201, 409]);
    const winner = await prisma.catalogProposal.findUniqueOrThrow({
      where: { id: target!.selection.proposals[0]!.id },
    });
    expect([canvas.id, oil.id]).toContain(winner.mappedTermId);
    expect(
      await prisma.productRevisionTerm.count({
        where: {
          revisionId: work.revision.id,
          termId: winner.mappedTermId === canvas.id ? oil.id : canvas.id,
        },
      }),
    ).toBe(0);
    const stale = await admin.client.patch(`/admin/products/${work.product.id}/status`, {
      status: 'APPROVED',
      target: { kind: 'revision', id: target!.id, updatedAt: target!.updatedAt },
    });
    expect(stale.status).toBe(409);
    const fresh = await admin.client.get('/admin/products?filter=PENDING_REVIEW');
    const next = (
      (await fresh.json()) as {
        products: Array<{ id: string; reviewTarget: { id: string; updatedAt: string } | null }>;
      }
    ).products.find((item) => item.id === work.product.id)?.reviewTarget;
    expect(next?.updatedAt).not.toBe(target!.updatedAt);
    const approved = await admin.client.patch(`/admin/products/${work.product.id}/status`, {
      status: 'APPROVED',
      target: { kind: 'revision', id: next!.id, updatedAt: next!.updatedAt },
    });
    expect(approved.status, await approved.text()).toBe(200);

    const rejectedWork = await draftWork(
      owner.id,
      profile.id,
      'Rejected proposal',
      painting.id,
    );
    expect(
      (
        await owner.client.patch(`/products/${rejectedWork.product.id}`, {
          materialProposals: ['Запрещённый грунт'],
        })
      ).status,
    ).toBe(200);
    expect(
      (await owner.client.post(`/products/${rejectedWork.product.id}/submit`)).status,
    ).toBe(201);
    const rejectedList = await admin.client.get('/admin/products?filter=PENDING_REVIEW');
    const rejectedTarget = (
      (await rejectedList.json()) as {
        products: Array<{
          id: string;
          reviewTarget: {
            id: string;
            updatedAt: string;
            selection: { proposals: Array<{ id: string; rawName: string }> };
          } | null;
        }>;
      }
    ).products.find((item) => item.id === rejectedWork.product.id)?.reviewTarget;
    const rejectedProposal = rejectedTarget!.selection.proposals.find(
      (item) => item.rawName === 'Запрещённый грунт',
    )!;
    expect(
      (
        await admin.client.post(
          `/admin/catalog/proposals/${rejectedProposal.id}/reject`,
          { reason: 'Не тот материал' },
        )
      ).status,
    ).toBe(201);
    const afterReject = await owner.client.get(
      `/seller/products/${rejectedWork.product.id}`,
    );
    const rejectedView = (
      (await afterReject.json()) as {
        selection: {
          proposals: Array<{ status: string; selected: boolean; rejectionReason: string | null }>;
        };
      }
    ).selection.proposals[0]!;
    expect(rejectedView.status).toBe('REJECTED');
    expect(rejectedView.rejectionReason).toBe('Не тот материал');
    expect(
      (
        await owner.client.patch(`/products/${rejectedWork.product.id}`, {
          materialProposals: [],
        })
      ).status,
    ).toBe(200);
    expect(
      (await owner.client.post(`/products/${rejectedWork.product.id}/submit`)).status,
    ).toBe(201);
    const cleared = await admin.client.get('/admin/products?filter=PENDING_REVIEW');
    const clearedTarget = (
      (await cleared.json()) as {
        products: Array<{
          id: string;
          reviewTarget: { id: string; updatedAt: string } | null;
        }>;
      }
    ).products.find((item) => item.id === rejectedWork.product.id)?.reviewTarget;
    expect(
      (
        await admin.client.patch(`/admin/products/${rejectedWork.product.id}/status`, {
          status: 'APPROVED',
          target: {
            kind: 'revision',
            id: clearedTarget!.id,
            updatedAt: clearedTarget!.updatedAt,
          },
        })
      ).status,
    ).toBe(200);
    const kept = await prisma.catalogProposal.findUniqueOrThrow({
      where: { id: rejectedProposal.id },
    });
    expect(kept.status).toBe('REJECTED');
    expect(kept.selected).toBe(false);

    const selectedAgain = await draftWork(
      owner.id,
      profile.id,
      'Selected rejection',
      painting.id,
    );
    expect(
      (
        await owner.client.patch(`/products/${selectedAgain.product.id}`, {
          materialProposals: ['Скрытый грунт'],
        })
      ).status,
    ).toBe(200);
    expect(
      (await owner.client.post(`/products/${selectedAgain.product.id}/submit`)).status,
    ).toBe(201);
    const hiddenList = await admin.client.get('/admin/products?filter=PENDING_REVIEW');
    const hiddenTarget = (
      (await hiddenList.json()) as {
        products: Array<{
          id: string;
          reviewTarget: {
            selection: { proposals: Array<{ id: string }> };
          } | null;
        }>;
      }
    ).products.find((item) => item.id === selectedAgain.product.id)?.reviewTarget;
    expect(
      (
        await admin.client.post(
          `/admin/catalog/proposals/${hiddenTarget!.selection.proposals[0]!.id}/reject`,
          { reason: 'Повторите решение' },
        )
      ).status,
    ).toBe(201);
    const reselected = await owner.client.patch(`/products/${selectedAgain.product.id}`, {
      materialProposals: ['  скрытый   ГРУНТ '],
    });
    expect(reselected.status).toBe(200);
    const reselectedView = (
      (await (
        await owner.client.get(`/seller/products/${selectedAgain.product.id}`)
      ).json()) as {
        selection: { proposals: Array<{ status: string; selected: boolean }> };
      }
    ).selection.proposals[0]!;
    expect(reselectedView.status).toBe('REJECTED');
    expect(reselectedView.selected).toBe(true);
    expect(
      (await owner.client.post(`/products/${selectedAgain.product.id}/submit`)).status,
    ).toBe(201);
    const blockedList = await admin.client.get('/admin/products?filter=PENDING_REVIEW');
    const blockedTarget = (
      (await blockedList.json()) as {
        products: Array<{
          id: string;
          reviewTarget: { id: string; updatedAt: string } | null;
        }>;
      }
    ).products.find((item) => item.id === selectedAgain.product.id)?.reviewTarget;
    const blocked = await admin.client.patch(
      `/admin/products/${selectedAgain.product.id}/status`,
      {
        status: 'APPROVED',
        target: {
          kind: 'revision',
          id: blockedTarget!.id,
          updatedAt: blockedTarget!.updatedAt,
        },
      },
    );
    expect(blocked.status).toBe(409);
    expect(await blocked.text()).toContain(
      'Selected catalog proposals must be resolved before approval',
    );
  });

  it('repeats a story asset without multiplying bytes and searches published terms', async () => {
    await bootstrapCatalog(prisma as never);
    const { owner, profile, painting } = await authorWithoutCity();
    const work = await draftWork(owner.id, profile.id, 'Repeated image', painting.id);
    const asset = await storyAsset(owner.id, work.revision.id);
    const repeated = await owner.client.put(`/products/${work.product.id}/creation`, {
      storyToken: 0,
      blocks: [
        { type: 'IMAGE', mediaAssetId: asset.id, altText: 'Первый' },
        { type: 'PARAGRAPH', text: 'Уникальная подпись' },
        { type: 'IMAGE', mediaAssetId: asset.id, altText: 'Второй' },
      ],
    });
    expect(repeated.status).toBe(200);
    const blocks = (
      (await repeated.json()) as { blocks: Array<{ id: string; type: string }> }
    ).blocks;
    expect(blocks.filter((block) => block.type === 'IMAGE')).toHaveLength(2);
    expect(new Set(blocks.map((block) => block.id)).size).toBe(3);
    const sixth = await owner.client.put(`/products/${work.product.id}/creation`, {
      storyToken: 1,
      blocks: Array.from({ length: 6 }, () => ({
        type: 'IMAGE' as const,
        mediaAssetId: asset.id,
      })),
    });
    expect(sixth.status).toBe(400);
    const outsider = await user();
    const foreign = await storyAsset(outsider.id, work.revision.id);
    await prisma.mediaAsset.update({
      where: { id: foreign.id },
      data: { ownerUserId: outsider.id },
    });
    const rejectedAsset = await owner.client.put(`/products/${work.product.id}/creation`, {
      storyToken: 1,
      blocks: [{ type: 'IMAGE', mediaAssetId: foreign.id }],
    });
    expect(rejectedAsset.status).toBe(409);
    const heavyIds = [];
    for (let index = 0; index < 5; index += 1) {
      const heavy = await storyAsset(owner.id, work.revision.id);
      await prisma.mediaObject.updateMany({
        where: { assetId: heavy.id, variant: 'SOURCE' },
        data: { byteLength: 4_194_305 },
      });
      heavyIds.push(heavy.id);
    }
    const overBudget = await owner.client.put(`/products/${work.product.id}/creation`, {
      storyToken: 1,
      blocks: heavyIds.map((mediaAssetId) => ({ type: 'IMAGE' as const, mediaAssetId })),
    });
    expect(overBudget.status).toBe(409);
    const canvas = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'MATERIAL', slug: 'canvas' } },
    });
    await prisma.productRevision.update({
      where: { id: work.revision.id },
      data: { materials: 'Бумага', status: 'APPROVED' },
    });
    await prisma.productRevisionTerm.create({
      data: { revisionId: work.revision.id, termId: canvas.id },
    });
    await prisma.product.update({
      where: { id: work.product.id },
      data: {
        status: 'APPROVED',
        publishedAt: new Date(),
        publishedRevisionId: work.revision.id,
        materials: 'Бумага',
      },
    });
    const guest = new HttpTestClient(http.baseUrl);
    const byName = await guest.get(`/works?q=${encodeURIComponent('Холст')}`);
    const byString = await guest.get(`/works?q=${encodeURIComponent('Бумага')}`);
    const byStory = await guest.get(`/works?q=${encodeURIComponent('Уникальная подпись')}`);
    const byId = await guest.get(`/works?materialId=${canvas.id}`);
    const ids = async (response: Response) =>
      (
        (await response.json()) as { works: Array<{ work: { publicId: string } }> }
      ).works.map((item) => item.work.publicId);
    expect(await ids(byName)).toContain(work.product.publicId);
    expect(await ids(byStory)).toContain(work.product.publicId);
    expect(await ids(byId)).toContain(work.product.publicId);
    expect(await ids(byString)).not.toContain(work.product.publicId);
    const facets = await guest.get('/portfolio/facets');
    expect(
      ((await facets.json()) as { materials: string[] }).materials,
    ).toContain('Холст');
  });

  it('returns the saved term projection and reads hidden selected records', async () => {
    await bootstrapCatalog(prisma as never);
    const { owner, profile, painting } = await authorWithoutCity();
    const admin = await user('admin');
    const canvas = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'MATERIAL', slug: 'canvas' } },
    });
    const oil = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'MATERIAL', slug: 'oil' } },
    });
    const drawing = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'TECHNIQUE', slug: 'drawing' } },
    });
    const modeling = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'TECHNIQUE', slug: 'modeling' } },
    });
    const sculpture = await prisma.category.findUniqueOrThrow({
      where: { slug: 'sculpture' },
    });
    const created = await owner.client.post('/products', {
      title: 'Projected work',
      categoryId: painting.id,
      materialTermIds: [canvas.id],
      techniqueTermIds: [drawing.id],
    });
    expect(created.status, await created.clone().text()).toBe(201);
    const createdBody = (await created.json()) as {
      product: { id: string; materials: string | null; technique: string | null };
    };
    expect(createdBody.product).toMatchObject({
      materials: 'Холст',
      technique: 'Рисунок',
    });
    const createdList = await owner.client.get('/seller/products');
    expect(createdList.status).toBe(200);
    expect(
      (
        (await createdList.json()) as {
          products: Array<{ id: string; materials: string | null; technique: string | null }>;
        }
      ).products.find((item) => item.id === createdBody.product.id),
    ).toMatchObject({
      materials: 'Холст',
      technique: 'Рисунок',
    });
    const read = async () => {
      const response = await owner.client.get(`/seller/products/${createdBody.product.id}`);
      expect(response.status).toBe(200);
      return (await response.json()) as {
        product: { materials: string | null; technique: string | null };
        selection: {
          category: { id: string; name: string; active: boolean } | null;
          materialTerms: Array<{ id: string; name: string; active: boolean; role: string }>;
          techniqueTerms: Array<{ id: string; name: string; active: boolean }>;
        };
      };
    };
    expect((await read()).product).toMatchObject({
      materials: createdBody.product.materials,
      technique: createdBody.product.technique,
    });
    const replaced = await owner.client.patch(`/products/${createdBody.product.id}`, {
      materialTermIds: [oil.id],
      techniqueTermIds: [modeling.id],
    });
    expect(replaced.status, await replaced.clone().text()).toBe(200);
    const replacedBody = (await replaced.json()) as {
      product: { materials: string | null; technique: string | null };
    };
    expect(replacedBody.product).toMatchObject({
      materials: 'Масло',
      technique: 'Лепка',
    });
    expect((await read()).product).toMatchObject({
      materials: replacedBody.product.materials,
      technique: replacedBody.product.technique,
    });
    const cleared = await owner.client.patch(`/products/${createdBody.product.id}`, {
      materialTermIds: [],
      techniqueTermIds: [],
    });
    expect(cleared.status, await cleared.clone().text()).toBe(200);
    const clearedBody = (await cleared.json()) as {
      product: { materials: string | null; technique: string | null };
    };
    expect(clearedBody.product.materials).toBeNull();
    expect(clearedBody.product.technique).toBeNull();
    const empty = await read();
    expect(empty.product.materials).toBeNull();
    expect(empty.product.technique).toBeNull();
    expect(empty.selection.materialTerms).toEqual([]);
    expect(empty.selection.techniqueTerms).toEqual([]);
    const revisionId = (
      await prisma.product.findUniqueOrThrow({
        where: { id: createdBody.product.id },
        select: { editingRevisionId: true },
      })
    ).editingRevisionId;
    await prisma.productRevision.update({
      where: { id: revisionId! },
      data: { materials: 'Unregistered material', technique: 'Unregistered technique' },
    });
    await prisma.product.update({
      where: { id: createdBody.product.id },
      data: { materials: 'Unregistered material', technique: 'Unregistered technique' },
    });
    const staleColumn = await read();
    expect(staleColumn.product.materials).toBeNull();
    expect(staleColumn.product.technique).toBeNull();
    const staleList = await owner.client.get('/seller/products');
    expect(
      (
        (await staleList.json()) as {
          products: Array<{ id: string; materials: string | null; technique: string | null }>;
        }
      ).products.find((item) => item.id === createdBody.product.id),
    ).toMatchObject({ materials: null, technique: null });
    expect(
      (await owner.client.patch(`/products/${createdBody.product.id}`, {
        materials: 'Unregistered material',
      })).status,
    ).toBe(400);
    expect(
      (await owner.client.post('/products', { title: 'Free text', technique: 'Oil' })).status,
    ).toBe(400);
    const reselected = await owner.client.patch(`/products/${createdBody.product.id}`, {
      materialTermIds: [canvas.id],
      techniqueTermIds: [drawing.id],
    });
    expect(reselected.status, await reselected.clone().text()).toBe(200);
    await prisma.catalogTerm.update({ where: { id: canvas.id }, data: { active: false } });
    await prisma.catalogTerm.update({ where: { id: drawing.id }, data: { active: false } });
    await prisma.category.update({ where: { id: painting.id }, data: { active: false } });
    const hidden = await read();
    expect(hidden.selection.category).toMatchObject({
      id: painting.id,
      name: 'Живопись',
      active: false,
    });
    expect(hidden.selection.materialTerms[0]).toMatchObject({
      id: canvas.id,
      name: 'Холст',
      active: false,
      role: 'MATERIAL',
    });
    expect(hidden.selection.techniqueTerms[0]).toMatchObject({
      id: drawing.id,
      name: 'Рисунок',
      active: false,
    });
    const picker = await owner.client.get('/catalog/terms?role=MATERIAL');
    expect(
      ((await picker.json()) as { terms: Array<{ id: string }> }).terms.some(
        (term) => term.id === canvas.id,
      ),
    ).toBe(false);
    expect(
      (
        await owner.client.post('/products', {
          title: 'Hidden term',
          categoryId: sculpture.id,
          materialTermIds: [canvas.id],
        })
      ).status,
    ).toBe(409);
    const profileResponse = await owner.client.get('/seller/profile');
    expect(profileResponse.status).toBe(200);
    const profileBody = (await profileResponse.json()) as {
      sellerProfile: {
        directionCategoryIds: string[];
        directions: Array<{ id: string; name: string; active: boolean }>;
      };
    };
    expect(profileBody.sellerProfile.directionCategoryIds).toContain(painting.id);
    expect(profileBody.sellerProfile.directions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: painting.id, name: 'Живопись', active: false }),
      ]),
    );
    const image = await prisma.productImage.create({
      data: {
        productId: createdBody.product.id,
        position: 0,
        mimeType: 'image/png',
        byteLength: permissionImage.byteLength,
        data: permissionImage,
        checksum: 'd'.repeat(64),
      },
    });
    await prisma.productRevisionImage.create({
      data: { revisionId: revisionId!, imageId: image.id, position: 0 },
    });
    expect((await owner.client.post(`/products/${createdBody.product.id}/submit`)).status).toBe(
      201,
    );
    const adminProducts = await admin.client.get('/admin/products?filter=PENDING_REVIEW');
    const review = (
      (await adminProducts.json()) as {
        products: Array<{
          id: string;
          reviewTarget: {
            selection: {
              category: { name: string; active: boolean } | null;
              materialTerms: Array<{ id: string; name: string; active: boolean }>;
            };
          } | null;
        }>;
      }
    ).products.find((item) => item.id === createdBody.product.id);
    expect(review?.reviewTarget?.selection.materialTerms[0]).toMatchObject({
      id: canvas.id,
      name: 'Холст',
      active: false,
    });
    expect(review?.reviewTarget?.selection.category).toMatchObject({
      name: 'Живопись',
      active: false,
    });
    const adminSellers = await admin.client.get('/admin/seller-profiles?filter=APPROVED');
    const seller = (
      (await adminSellers.json()) as {
        sellerProfiles: Array<{
          id: string;
          reviewTarget: {
            content: { directions: Array<{ id: string; name: string; active: boolean }> };
          } | null;
        }>;
      }
    ).sellerProfiles.find((item) => item.id === profile.id);
    expect(seller?.reviewTarget?.content.directions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: painting.id, name: 'Живопись', active: false }),
      ]),
    );
  });

  it('reads materials and technique from the revision each response represents', async () => {
    await bootstrapCatalog(prisma as never);
    const { owner, painting } = await authorWithoutCity();
    const admin = await user('admin');
    const canvas = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'MATERIAL', slug: 'canvas' } },
    });
    const oil = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'MATERIAL', slug: 'oil' } },
    });
    const drawing = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'TECHNIQUE', slug: 'drawing' } },
    });
    const modeling = await prisma.catalogTerm.findUniqueOrThrow({
      where: { role_slug: { role: 'TECHNIQUE', slug: 'modeling' } },
    });
    const created = await owner.client.post('/products', {
      title: 'Canonical labels',
      categoryId: painting.id,
      materialTermIds: [canvas.id],
      techniqueTermIds: [drawing.id],
    });
    expect(created.status, await created.clone().text()).toBe(201);
    const productId = ((await created.json()) as { product: { id: string } }).product.id;
    const listed = async () => {
      const response = await owner.client.get('/seller/products');
      expect(response.status).toBe(200);
      const product = (
        (await response.json()) as {
          products: Array<{
            id: string;
            materials: string | null;
            technique: string | null;
            status: string;
          }>;
        }
      ).products.find((item) => item.id === productId);
      expect(product).toBeDefined();
      return product!;
    };
    const detail = async () => {
      const response = await owner.client.get(`/seller/products/${productId}`);
      expect(response.status).toBe(200);
      return (await response.json()) as {
        product: { materials: string | null; technique: string | null; status: string };
        selection: {
          materialTerms: Array<{ id: string; name: string; active: boolean }>;
          techniqueTerms: Array<{ id: string; name: string; active: boolean }>;
        };
      };
    };
    const productBody = async (response: Response) =>
      (await response.json()) as {
        product: { materials: string | null; technique: string | null; status: string };
      };

    expect(await listed()).toMatchObject({ materials: 'Холст', technique: 'Рисунок' });
    expect((await detail()).product).toMatchObject({ materials: 'Холст', technique: 'Рисунок' });

    const revisionId = (
      await prisma.product.findUniqueOrThrow({
        where: { id: productId },
        select: { editingRevisionId: true },
      })
    ).editingRevisionId!;
    const image = await prisma.productImage.create({
      data: {
        productId,
        position: 0,
        mimeType: 'image/png',
        byteLength: permissionImage.byteLength,
        data: permissionImage,
        checksum: 'd'.repeat(64),
      },
    });
    await prisma.productRevisionImage.create({
      data: { revisionId, imageId: image.id, position: 0 },
    });
    expect((await owner.client.post(`/products/${productId}/submit`)).status).toBe(201);
    const approved = await admin.client.patch(
      `/admin/products/${productId}/status`,
      await productModerationRequest(prisma, productId, 'APPROVED'),
    );
    expect(approved.status, await approved.clone().text()).toBe(200);
    expect((await productBody(approved)).product).toMatchObject({
      materials: 'Холст',
      technique: 'Рисунок',
    });

    await prisma.catalogTerm.update({
      where: { id: canvas.id },
      data: { name: 'Холст обновлённый' },
    });
    await prisma.catalogTerm.update({
      where: { id: drawing.id },
      data: { name: 'Рисунок обновлённый' },
    });
    const publishedRevisionId = (
      await prisma.product.findUniqueOrThrow({
        where: { id: productId },
        select: { publishedRevisionId: true },
      })
    ).publishedRevisionId!;
    await prisma.product.update({
      where: { id: productId },
      data: { materials: 'Холст', technique: 'Рисунок' },
    });
    await prisma.productRevision.update({
      where: { id: publishedRevisionId },
      data: { materials: 'Холст', technique: 'Рисунок' },
    });
    const renamed = { materials: 'Холст обновлённый', technique: 'Рисунок обновлённый' };
    expect(await listed()).toMatchObject(renamed);
    expect((await detail()).product).toMatchObject(renamed);

    const hidden = await owner.client.post(`/products/${productId}/hide`);
    expect(hidden.status, await hidden.clone().text()).toBe(201);
    expect((await productBody(hidden)).product).toMatchObject({
      ...renamed,
      status: 'ARCHIVED',
    });
    const restored = await owner.client.post(`/products/${productId}/unhide`);
    expect(restored.status, await restored.clone().text()).toBe(201);
    expect((await productBody(restored)).product).toMatchObject({
      ...renamed,
      status: 'APPROVED',
    });

    const archived = await admin.client.patch(
      `/admin/products/${productId}/status`,
      await productModerationRequest(
        prisma,
        productId,
        'ARCHIVED',
        'Работа временно скрыта',
      ),
    );
    expect(archived.status, await archived.clone().text()).toBe(200);
    expect((await productBody(archived)).product).toMatchObject({
      ...renamed,
      status: 'ARCHIVED',
    });
    const republished = await admin.client.patch(
      `/admin/products/${productId}/status`,
      await productModerationRequest(prisma, productId, 'APPROVED'),
    );
    expect(republished.status, await republished.clone().text()).toBe(200);
    expect((await productBody(republished)).product).toMatchObject({
      ...renamed,
      status: 'APPROVED',
    });

    await prisma.catalogTerm.update({ where: { id: canvas.id }, data: { active: false } });
    await prisma.catalogTerm.update({ where: { id: drawing.id }, data: { active: false } });
    const hiddenCatalog = await detail();
    expect(hiddenCatalog.product).toMatchObject(renamed);
    expect(hiddenCatalog.selection.materialTerms[0]).toMatchObject({
      id: canvas.id,
      name: 'Холст обновлённый',
      active: false,
    });
    expect(hiddenCatalog.selection.techniqueTerms[0]).toMatchObject({
      id: drawing.id,
      name: 'Рисунок обновлённый',
      active: false,
    });
    expect(await listed()).toMatchObject(renamed);

    const edited = await owner.client.patch(`/products/${productId}`, {
      materialTermIds: [oil.id],
      techniqueTermIds: [modeling.id],
    });
    expect(edited.status, await edited.clone().text()).toBe(200);
    const draftLabels = { materials: 'Масло', technique: 'Лепка' };
    expect((await productBody(edited)).product).toMatchObject(draftLabels);
    expect((await detail()).product).toMatchObject(draftLabels);
    expect(await listed()).toMatchObject(renamed);

    const adminList = await admin.client.get('/admin/products?filter=APPROVED');
    expect(adminList.status).toBe(200);
    const adminProduct = (
      (await adminList.json()) as {
        products: Array<{
          id: string;
          parent: { materials: string | null; technique: string | null };
          reviewTarget: {
            content: { materials: string | null; technique: string | null };
          } | null;
        }>;
      }
    ).products.find((item) => item.id === productId);
    expect(adminProduct?.parent).toMatchObject(renamed);
    expect(adminProduct?.reviewTarget?.content).toMatchObject(draftLabels);

    const hiddenDraft = await owner.client.post(`/products/${productId}/hide`);
    expect(hiddenDraft.status, await hiddenDraft.clone().text()).toBe(201);
    expect((await productBody(hiddenDraft)).product).toMatchObject({
      ...renamed,
      status: 'ARCHIVED',
    });
    await prisma.productRevisionTerm.deleteMany({ where: { revisionId: publishedRevisionId } });
    await prisma.product.update({
      where: { id: productId },
      data: { materials: 'Холст', technique: 'Рисунок' },
    });
    await prisma.productRevision.update({
      where: { id: publishedRevisionId },
      data: { materials: 'Холст', technique: 'Рисунок' },
    });
    expect(await listed()).toMatchObject({ materials: null, technique: null });
    expect((await detail()).product).toMatchObject(draftLabels);
    const unhidden = await owner.client.post(`/products/${productId}/unhide`);
    expect(unhidden.status, await unhidden.clone().text()).toBe(201);
    expect((await productBody(unhidden)).product).toMatchObject({
      materials: null,
      technique: null,
      status: 'APPROVED',
    });
  });
});

import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import { latestModerationReasonSql } from '../../src/admin/admin-moderation-list';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import { fixturePasswordHash, permissionImage } from './permission-fixtures';
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

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

function client(ip: string) {
  return new HttpTestClient(http.baseUrl, 'http://localhost:8081', ip);
}

function listPath(
  resource: 'seller-profiles' | 'products',
  query: Record<string, string | number | undefined> = {},
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const text = params.toString();
  return `/admin/${resource}${text ? `?${text}` : ''}`;
}

async function createUser(role: 'admin' | 'user', label: string) {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      email: `${label}.${suffix}@moderation-page.test`,
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

async function login(
  api: HttpTestClient,
  user: { email: string; password: string },
) {
  const response = await api.post('/auth/login', {
    email: user.email,
    password: user.password,
  });
  expect(response.status).toBe(201);
}

async function createSeller(input: {
  id: string;
  fullName: string;
  slug: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED';
  createdAt: Date;
  discipline?: string | null;
  revision?: {
    id: string;
    fullName: string;
    status: 'PENDING_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED';
    slug?: string;
    discipline?: string | null;
  };
}) {
  const user = await createUser('user', input.slug);
  await prisma.sellerProfile.create({
    data: {
      id: input.id,
      userId: user.id,
      slug: input.slug,
      sellerType: 'creator',
      fullName: input.fullName,
      country: 'BY',
      city: 'Minsk',
      discipline: 'discipline' in input ? input.discipline : 'Керамика',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: permissionImage.byteLength,
      profilePhotoChecksum: '0'.repeat(64),
      profilePhotoData: permissionImage,
      shortDescription: 'Moderation page fixture',
      status: input.status,
      createdAt: input.createdAt,
    },
  });
  if (!input.revision) return;
  await prisma.sellerProfileRevision.create({
    data: {
      id: input.revision.id,
      sellerProfileId: input.id,
      version: 1,
      status: input.revision.status,
      slug: input.revision.slug ?? `${input.slug}-revision`,
      fullName: input.revision.fullName,
      discipline:
        'discipline' in input.revision ? input.revision.discipline : 'Керамика',
      country: 'BY',
      city: 'Minsk',
      shortDescription: 'Revision fixture',
    },
  });
  await prisma.sellerProfile.update({
    where: { id: input.id },
    data: { editingRevisionId: input.revision.id },
  });
}

async function createProduct(input: {
  id: string;
  publicId: string;
  sellerProfileId: string;
  title: string | null;
  status: 'PENDING_REVIEW' | 'APPROVED';
  createdAt: Date;
  revision?: {
    id: string;
    title: string;
    status: 'PENDING_REVIEW' | 'CHANGES_REQUESTED';
  };
}) {
  await prisma.product.create({
    data: {
      id: input.id,
      publicId: input.publicId,
      sellerProfileId: input.sellerProfileId,
      title: input.title,
      status: input.status,
      createdAt: input.createdAt,
    },
  });
  if (!input.revision) return;
  await prisma.productRevision.create({
    data: {
      id: input.revision.id,
      productId: input.id,
      version: 1,
      status: input.revision.status,
      title: input.revision.title,
    },
  });
  await prisma.product.update({
    where: { id: input.id },
    data: { editingRevisionId: input.revision.id },
  });
}

type SellerList = {
  sellerProfiles: Array<{
    id: string;
    lastModerationReason: string | null;
    parentStatus: string;
    reviewTarget: { status: string; content: { fullName: string } } | null;
  }>;
  nextCursor: string | null;
};

type ProductList = {
  products: Array<{
    id: string;
    parentStatus: string;
    reviewTarget: { status: string; content: { title: string | null } } | null;
    lastModerationReason: string | null;
  }>;
  nextCursor: string | null;
};

describe('admin moderation pagination', () => {
  it('allows only an admin to read a bounded seller page', async () => {
    const admin = await createUser('admin', 'page-admin');
    const member = await createUser('user', 'page-member');
    const adminClient = client('203.0.113.19');
    const memberClient = client('203.0.113.20');
    const guest = client('203.0.113.21');
    await login(adminClient, admin);
    await login(memberClient, member);

    expect((await guest.get('/admin/seller-profiles')).status).toBe(401);
    expect((await memberClient.get('/admin/seller-profiles')).status).toBe(403);
    const response = await adminClient.get(
      listPath('seller-profiles', { limit: 1 }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as SellerList;
    expect(body.sellerProfiles.length).toBeLessThanOrEqual(1);
    expect(body).toHaveProperty('nextCursor');
  });

  it('rejects an invalid cursor and an oversized limit instead of returning the first page', async () => {
    const admin = await createUser('admin', 'cursor-admin');
    const api = client('203.0.113.22');
    await login(api, admin);
    const sellerId = '00000000-0000-4000-8000-00000000c101';
    await createSeller({
      id: sellerId,
      fullName: 'Cursor Anchor',
      slug: `cursor-anchor-${sellerId.slice(0, 8)}`,
      status: 'PENDING_REVIEW',
      createdAt: new Date('2026-09-26T12:00:00.000Z'),
    });

    const invalid = await api.get(
      listPath('seller-profiles', { cursor: 'not-a-cursor', limit: 1 }),
    );
    expect(invalid.status).toBe(400);
    const invalidBody = await invalid.json();
    expect(JSON.stringify(invalidBody)).not.toContain(sellerId);

    const oversized = await api.get(listPath('products', { limit: 101 }));
    expect(oversized.status).toBe(400);
  });

  it('pages tied timestamps without skips or duplicates and ends the cursor', async () => {
    const admin = await createUser('admin', 'tie-admin');
    const api = client('203.0.113.23');
    await login(api, admin);
    const tiedAt = new Date('2026-09-26T12:00:00.000Z');
    const ids = [
      '00000000-0000-4000-8000-00000000d101',
      '00000000-0000-4000-8000-00000000d102',
      '00000000-0000-4000-8000-00000000d103',
    ];
    await createSeller({
      id: ids[1]!,
      fullName: 'Tied two',
      slug: 'tied-two-d102',
      status: 'APPROVED',
      createdAt: tiedAt,
    });
    await createSeller({
      id: ids[0]!,
      fullName: 'Tied one',
      slug: 'tied-one-d101',
      status: 'APPROVED',
      createdAt: tiedAt,
    });
    await createSeller({
      id: ids[2]!,
      fullName: 'Tied three',
      slug: 'tied-three-d103',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T12:00:01.000Z'),
    });

    const seen: string[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 4; page += 1) {
      const response = await api.get(
        listPath('seller-profiles', {
          limit: 1,
          filter: 'APPROVED',
          search: 'Tied',
          cursor,
        }),
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as SellerList;
      expect(body.sellerProfiles.length).toBeLessThanOrEqual(1);
      seen.push(...body.sellerProfiles.map((seller) => seller.id));
      if (!body.nextCursor) break;
      cursor = body.nextCursor;
    }

    expect(seen.filter((id) => ids.includes(id))).toEqual(ids);
    expect(new Set(seen.filter((id) => ids.includes(id))).size).toBe(
      ids.length,
    );
  });

  it('filters review status on the revision and visibility on the parent', async () => {
    const admin = await createUser('admin', 'filter-admin');
    const api = client('203.0.113.24');
    await login(api, admin);
    const stamp = new Date('2026-09-26T13:00:00.000Z');
    const approvedPending = '00000000-0000-4000-8000-00000000e101';
    const legacyPending = '00000000-0000-4000-8000-00000000e102';
    const approvedChanges = '00000000-0000-4000-8000-00000000e103';
    const draft = '00000000-0000-4000-8000-00000000e104';
    const productPending = '00000000-0000-4000-8000-00000000e201';
    const productLegacy = '00000000-0000-4000-8000-00000000e202';
    await createSeller({
      id: approvedPending,
      fullName: 'Approved parent',
      slug: 'filter-approved-pending',
      status: 'APPROVED',
      createdAt: stamp,
      revision: {
        id: '00000000-0000-4000-8000-00000000e111',
        fullName: 'Pending revision',
        status: 'PENDING_REVIEW',
      },
    });
    await createSeller({
      id: legacyPending,
      fullName: 'Legacy pending',
      slug: 'filter-legacy-pending',
      status: 'PENDING_REVIEW',
      createdAt: stamp,
    });
    await createSeller({
      id: approvedChanges,
      fullName: 'Approved changes',
      slug: 'filter-approved-changes',
      status: 'APPROVED',
      createdAt: stamp,
      revision: {
        id: '00000000-0000-4000-8000-00000000e112',
        fullName: 'Changes revision',
        status: 'CHANGES_REQUESTED',
      },
    });
    await createSeller({
      id: draft,
      fullName: 'Draft author',
      slug: 'filter-draft-author',
      status: 'DRAFT',
      createdAt: stamp,
    });
    await createProduct({
      id: productPending,
      publicId: 'filtwork001',
      sellerProfileId: approvedPending,
      title: 'Published work',
      status: 'APPROVED',
      createdAt: stamp,
      revision: {
        id: '00000000-0000-4000-8000-00000000e211',
        title: 'Pending work',
        status: 'PENDING_REVIEW',
      },
    });
    await createProduct({
      id: productLegacy,
      publicId: 'filtwork002',
      sellerProfileId: approvedPending,
      title: 'Legacy pending work',
      status: 'PENDING_REVIEW',
      createdAt: stamp,
    });

    async function sellerIds(filter: string) {
      const response = await api.get(
        listPath('seller-profiles', { filter, limit: 100, search: 'filter-' }),
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as SellerList;
      return body.sellerProfiles.map((seller) => seller.id);
    }

    const pending = await sellerIds('PENDING_REVIEW');
    expect(pending).toEqual(
      expect.arrayContaining([approvedPending, legacyPending]),
    );
    expect(pending).not.toContain(approvedChanges);
    expect(pending).not.toContain(draft);

    const approved = await sellerIds('APPROVED');
    expect(approved).toEqual(
      expect.arrayContaining([approvedPending, approvedChanges]),
    );
    expect(approved).not.toContain(legacyPending);

    const changes = await sellerIds('CHANGES_REQUESTED');
    expect(changes).toContain(approvedChanges);
    expect(changes).not.toContain(approvedPending);

    const all = await sellerIds('ALL');
    expect(all).not.toContain(draft);

    const pendingProducts = await api.get(
      listPath('products', {
        filter: 'PENDING_REVIEW',
        limit: 100,
        search: 'work',
      }),
    );
    const pendingBody = (await pendingProducts.json()) as ProductList;
    const pendingProductIds = pendingBody.products.map((product) => product.id);
    expect(pendingProductIds).toContain(productPending);
    expect(pendingProductIds).not.toContain(productLegacy);

    const approvedProducts = await api.get(
      listPath('products', {
        filter: 'APPROVED',
        limit: 100,
        search: 'Pending work',
      }),
    );
    const approvedBody = (await approvedProducts.json()) as ProductList;
    expect(approvedBody.products.map((product) => product.id)).toContain(
      productPending,
    );
    expect(approvedBody.products.map((product) => product.id)).not.toContain(
      productLegacy,
    );
  });

  it('finds a revision beyond the first page and ignores the hidden parent text', async () => {
    const admin = await createUser('admin', 'search-admin');
    const api = client('203.0.113.25');
    await login(api, admin);
    const earlyId = '00000000-0000-4000-8000-00000000f101';
    const lateId = '00000000-0000-4000-8000-00000000f102';
    await createSeller({
      id: earlyId,
      fullName: 'Earlier author',
      slug: 'search-earlier-author',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T14:00:00.000Z'),
    });
    await createSeller({
      id: lateId,
      fullName: 'Hidden parent name',
      slug: 'search-hidden-parent',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T14:00:02.000Z'),
      revision: {
        id: '00000000-0000-4000-8000-00000000f111',
        fullName: 'Needle Marker',
        status: 'PENDING_REVIEW',
      },
    });

    const first = await api.get(
      listPath('seller-profiles', {
        limit: 1,
        filter: 'APPROVED',
        search: 'search-',
      }),
    );
    const firstBody = (await first.json()) as SellerList;
    expect(firstBody.sellerProfiles.map((seller) => seller.id)).toEqual([
      earlyId,
    ]);
    expect(firstBody.nextCursor).toEqual(expect.any(String));

    const found = await api.get(
      listPath('seller-profiles', {
        limit: 1,
        filter: 'ALL',
        search: 'needle',
      }),
    );
    const foundBody = (await found.json()) as SellerList;
    expect(foundBody.sellerProfiles.map((seller) => seller.id)).toEqual([
      lateId,
    ]);

    const hidden = await api.get(
      listPath('seller-profiles', { limit: 10, search: 'Hidden parent' }),
    );
    const hiddenBody = (await hidden.json()) as SellerList;
    expect(hiddenBody.sellerProfiles.map((seller) => seller.id)).not.toContain(
      lateId,
    );

    const productId = '00000000-0000-4000-8000-00000000f201';
    await createProduct({
      id: productId,
      publicId: 'needlework1',
      sellerProfileId: lateId,
      title: 'Old parent title',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T14:00:03.000Z'),
      revision: {
        id: '00000000-0000-4000-8000-00000000f211',
        title: 'Remote vessel',
        status: 'PENDING_REVIEW',
      },
    });
    const works = await api.get(
      listPath('products', { limit: 10, search: 'remote vessel' }),
    );
    const worksBody = (await works.json()) as ProductList;
    expect(worksBody.products.map((product) => product.id)).toContain(
      productId,
    );
    const oldTitle = await api.get(
      listPath('products', { limit: 10, search: 'Old parent title' }),
    );
    const oldBody = (await oldTitle.json()) as ProductList;
    expect(oldBody.products.map((product) => product.id)).not.toContain(
      productId,
    );

    const folded = await api.get(
      listPath('seller-profiles', { limit: 100, search: 'керамика' }),
    );
    const foldedBody = (await folded.json()) as SellerList;
    expect(foldedBody.sellerProfiles.map((seller) => seller.id)).toContain(
      earlyId,
    );
  });

  it('returns one latest non-empty reason for the page and leaves the rest of the history in the database', async () => {
    const admin = await createUser('admin', 'reason-admin');
    const api = client('203.0.113.26');
    await login(api, admin);
    const targetId = '00000000-0000-4000-8000-00000000a101';
    const otherId = '00000000-0000-4000-8000-00000000a102';
    const tiedAt = new Date('2026-09-26T15:00:00.000Z');
    await createSeller({
      id: targetId,
      fullName: 'Reason target',
      slug: 'reason-target-a101',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T15:00:00.000Z'),
    });
    await createSeller({
      id: otherId,
      fullName: 'Reason other',
      slug: 'reason-other-a102',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T15:00:01.000Z'),
    });
    await prisma.auditEvent.createMany({
      data: [
        {
          id: '00000000-0000-4000-8000-00000000a201',
          targetType: 'SELLER_PROFILE',
          targetId,
          reason: 'older',
          createdAt: new Date('2026-09-26T14:00:00.000Z'),
        },
        {
          id: '00000000-0000-4000-8000-00000000a202',
          targetType: 'SELLER_PROFILE',
          targetId,
          reason: 'tied-low',
          createdAt: tiedAt,
        },
        {
          id: '00000000-0000-4000-8000-00000000a203',
          targetType: 'SELLER_PROFILE',
          targetId,
          reason: 'tied-high',
          createdAt: tiedAt,
        },
        {
          id: '00000000-0000-4000-8000-00000000a204',
          targetType: 'SELLER_PROFILE',
          targetId,
          reason: '',
          createdAt: new Date('2026-09-26T16:00:00.000Z'),
        },
        {
          id: '00000000-0000-4000-8000-00000000a205',
          targetType: 'SELLER_PROFILE',
          targetId,
          reason: null,
          createdAt: new Date('2026-09-26T17:00:00.000Z'),
        },
        {
          id: '00000000-0000-4000-8000-00000000a206',
          targetType: 'SELLER_PROFILE',
          targetId: otherId,
          reason: 'off-page',
          createdAt: new Date('2026-09-26T17:00:00.000Z'),
        },
      ],
    });

    const response = await api.get(
      listPath('seller-profiles', {
        limit: 1,
        filter: 'APPROVED',
        search: 'reason-target',
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as SellerList;
    expect(body.sellerProfiles).toHaveLength(1);
    expect(body.sellerProfiles[0]).toMatchObject({
      id: targetId,
      lastModerationReason: 'tied-high',
    });
    const payload = JSON.stringify(body);
    expect(payload).not.toContain('older');
    expect(payload).not.toContain('tied-low');
    expect(payload).not.toContain('off-page');

    const selected = await prisma.$queryRaw<
      Array<{ target_id: string; reason: string }>
    >(latestModerationReasonSql('SELLER_PROFILE', [targetId]));
    const history = await prisma.auditEvent.count({
      where: { targetType: 'SELLER_PROFILE', targetId },
    });
    expect(selected).toHaveLength(1);
    expect(selected[0]?.reason).toBe('tied-high');
    expect(history).toBe(5);
    expect(selected.length).toBeLessThan(history);
  });

  it('treats search wildcards as literal text for authors and works', async () => {
    const admin = await createUser('admin', 'literal-admin');
    const api = client('203.0.113.27');
    await login(api, admin);
    const plainId = '00000000-0000-4000-8000-00000000e601';
    const percentId = '00000000-0000-4000-8000-00000000e602';
    const underscoreId = '00000000-0000-4000-8000-00000000e603';
    const slashId = '00000000-0000-4000-8000-00000000e604';
    await createSeller({
      id: plainId,
      fullName: 'Plain ceramics author',
      slug: 'plain-ceramics-author',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T18:00:00.000Z'),
    });
    await createSeller({
      id: percentId,
      fullName: 'Percent % maker',
      slug: 'percent-maker',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T18:00:01.000Z'),
    });
    await createSeller({
      id: underscoreId,
      fullName: 'Underscore author',
      slug: 'literal_under_token',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T18:00:02.000Z'),
    });
    await createSeller({
      id: slashId,
      fullName: 'Slash\\maker',
      slug: 'slash-maker',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T18:00:03.000Z'),
    });

    const sellerIdsFor = async (search: string) => {
      const response = await api.get(
        listPath('seller-profiles', { limit: 100, search }),
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as SellerList;
      return body.sellerProfiles.map((seller) => seller.id);
    };

    expect(await sellerIdsFor('%')).toContain(percentId);
    expect(await sellerIdsFor('%')).not.toContain(plainId);
    expect(await sellerIdsFor('_')).toContain(underscoreId);
    expect(await sellerIdsFor('_')).not.toContain(plainId);
    expect(await sellerIdsFor('\\')).toContain(slashId);
    expect(await sellerIdsFor('\\')).not.toContain(plainId);
    expect(await sellerIdsFor('literal_under_token')).toContain(underscoreId);
    expect(await sellerIdsFor('literalXunder_token')).not.toContain(
      underscoreId,
    );
    expect(await sellerIdsFor('plain ceramics')).toContain(plainId);
    expect(await sellerIdsFor('PERCENT % MAKER')).toContain(percentId);

    const plainWorkId = '00000000-0000-4000-8000-00000000e701';
    const percentWorkId = '00000000-0000-4000-8000-00000000e702';
    const underscoreWorkId = '00000000-0000-4000-8000-00000000e703';
    const slashWorkId = '00000000-0000-4000-8000-00000000e704';
    await createProduct({
      id: plainWorkId,
      publicId: 'plainvessel',
      sellerProfileId: plainId,
      title: 'Plain vessel',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T18:01:00.000Z'),
    });
    await createProduct({
      id: percentWorkId,
      publicId: 'percentwool',
      sellerProfileId: percentId,
      title: '100% wool',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T18:01:01.000Z'),
    });
    await createProduct({
      id: underscoreWorkId,
      publicId: 'underscore1',
      sellerProfileId: underscoreId,
      title: 'under_score cup',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T18:01:02.000Z'),
    });
    await createProduct({
      id: slashWorkId,
      publicId: 'slashvessel',
      sellerProfileId: slashId,
      title: 'slash\\vessel',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T18:01:03.000Z'),
    });

    const productIdsFor = async (search: string) => {
      const response = await api.get(
        listPath('products', { limit: 100, search }),
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as ProductList;
      return body.products.map((product) => product.id);
    };

    expect(await productIdsFor('%')).toContain(percentWorkId);
    expect(await productIdsFor('%')).not.toContain(plainWorkId);
    expect(await productIdsFor('_')).toContain(underscoreWorkId);
    expect(await productIdsFor('_')).not.toContain(plainWorkId);
    expect(await productIdsFor('\\')).toContain(slashWorkId);
    expect(await productIdsFor('\\')).not.toContain(plainWorkId);
    expect(await productIdsFor('under_score cup')).toContain(underscoreWorkId);
    expect(await productIdsFor('underXscore cup')).not.toContain(
      underscoreWorkId,
    );
    expect(await productIdsFor('PLAIN VESSEL')).toContain(plainWorkId);
  });

  it('matches the previous joined display text and keeps search pagination', async () => {
    const admin = await createUser('admin', 'joined-admin');
    const api = client('203.0.113.28');
    await login(api, admin);
    const boundaryId = '00000000-0000-4000-8000-00000000e301';
    const disciplineId = '00000000-0000-4000-8000-00000000e302';
    const blankId = '00000000-0000-4000-8000-00000000e303';
    const earlierId = '00000000-0000-4000-8000-00000000e304';
    const laterId = '00000000-0000-4000-8000-00000000e305';
    const tiedLowId = '00000000-0000-4000-8000-00000000e401';
    const tiedHighId = '00000000-0000-4000-8000-00000000e402';
    await createSeller({
      id: boundaryId,
      fullName: 'Hidden parent name',
      slug: 'parent-maker',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T19:00:00.000Z'),
      revision: {
        id: '00000000-0000-4000-8000-00000000e311',
        fullName: 'Maker Alpha',
        slug: 'parent-maker-revision',
        status: 'PENDING_REVIEW',
      },
    });
    await createSeller({
      id: disciplineId,
      fullName: 'Quiet',
      slug: 'quiet-maker',
      status: 'APPROVED',
      discipline: 'Керамика',
      createdAt: new Date('2026-09-26T19:00:01.000Z'),
    });
    await createSeller({
      id: blankId,
      fullName: 'Blank Discipline',
      slug: 'blank-discipline',
      status: 'APPROVED',
      discipline: null,
      createdAt: new Date('2026-09-26T19:00:02.000Z'),
    });
    await createSeller({
      id: earlierId,
      fullName: 'BoundaryAlpha earlier',
      slug: 'boundary-earlier',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T19:00:03.000Z'),
    });
    await createSeller({
      id: laterId,
      fullName: 'Maker BoundaryAlpha',
      slug: 'parent-boundary',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T19:00:04.000Z'),
    });
    const tiedAt = new Date('2026-09-26T19:00:05.000Z');
    await createSeller({
      id: tiedHighId,
      fullName: 'SameStampToken high',
      slug: 'same-stamp-high',
      status: 'APPROVED',
      createdAt: tiedAt,
    });
    await createSeller({
      id: tiedLowId,
      fullName: 'SameStampToken low',
      slug: 'same-stamp-low',
      status: 'APPROVED',
      createdAt: tiedAt,
    });

    const sellerIdsFor = async (
      search: string,
      extra: Record<string, string | number | undefined> = {},
    ) => {
      const response = await api.get(
        listPath('seller-profiles', { limit: 100, search, ...extra }),
      );
      expect(response.status).toBe(200);
      return (await response.json()) as SellerList;
    };

    const boundary = await sellerIdsFor('Alpha parent-maker-revision');
    expect(boundary.sellerProfiles.map((seller) => seller.id)).toContain(
      boundaryId,
    );
    const hidden = await sellerIdsFor('Hidden parent name');
    expect(hidden.sellerProfiles.map((seller) => seller.id)).not.toContain(
      boundaryId,
    );
    const nameToSlug = await sellerIdsFor('Alpha parent-maker');
    expect(nameToSlug.sellerProfiles.map((seller) => seller.id)).toContain(
      boundaryId,
    );
    const slugToDiscipline = await sellerIdsFor('quiet-maker Керамика');
    expect(
      slugToDiscipline.sellerProfiles.map((seller) => seller.id),
    ).toContain(disciplineId);
    const blank = await sellerIdsFor('blank-discipline');
    expect(blank.sellerProfiles.map((seller) => seller.id)).toContain(blankId);
    const blankMiss = await sellerIdsFor('blank-discipline Керамика');
    expect(blankMiss.sellerProfiles.map((seller) => seller.id)).not.toContain(
      blankId,
    );

    const firstPage = await sellerIdsFor('BoundaryAlpha', { limit: 1 });
    expect(firstPage.sellerProfiles.map((seller) => seller.id)).toEqual([
      earlierId,
    ]);
    expect(firstPage.nextCursor).toEqual(expect.any(String));
    const secondPage = await sellerIdsFor('BoundaryAlpha', {
      limit: 1,
      cursor: firstPage.nextCursor ?? undefined,
    });
    expect(secondPage.sellerProfiles.map((seller) => seller.id)).toEqual([
      laterId,
    ]);
    const joinedOnly = await sellerIdsFor('BoundaryAlpha parent-boundary');
    expect(joinedOnly.sellerProfiles.map((seller) => seller.id)).toEqual([
      laterId,
    ]);

    const tiedFirst = await sellerIdsFor('SameStampToken', { limit: 1 });
    expect(tiedFirst.sellerProfiles.map((seller) => seller.id)).toEqual([
      tiedLowId,
    ]);
    const tiedSecond = await sellerIdsFor('SameStampToken', {
      limit: 1,
      cursor: tiedFirst.nextCursor ?? undefined,
    });
    expect(tiedSecond.sellerProfiles.map((seller) => seller.id)).toEqual([
      tiedHighId,
    ]);
    expect(tiedSecond.nextCursor).toBeNull();

    const workSellerId = '00000000-0000-4000-8000-00000000e306';
    const workId = '00000000-0000-4000-8000-00000000e501';
    const blankWorkId = '00000000-0000-4000-8000-00000000e502';
    const revisedWorkId = '00000000-0000-4000-8000-00000000e503';
    await createSeller({
      id: workSellerId,
      fullName: 'Maker Alpha',
      slug: 'parent-maker-work',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T19:00:06.000Z'),
    });
    await createProduct({
      id: workId,
      publicId: 'remotevessl',
      sellerProfileId: workSellerId,
      title: 'Remote vessel',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T19:01:00.000Z'),
    });
    await createProduct({
      id: blankWorkId,
      publicId: 'blanktitle1',
      sellerProfileId: blankId,
      title: null,
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T19:01:01.000Z'),
    });
    await createProduct({
      id: revisedWorkId,
      publicId: 'revisedtitl',
      sellerProfileId: boundaryId,
      title: 'Old parent title',
      status: 'APPROVED',
      createdAt: new Date('2026-09-26T19:01:02.000Z'),
      revision: {
        id: '00000000-0000-4000-8000-00000000e513',
        title: 'Edited vessel',
        status: 'PENDING_REVIEW',
      },
    });

    const productIdsFor = async (search: string) => {
      const response = await api.get(
        listPath('products', { limit: 100, search }),
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as ProductList;
      return body.products.map((product) => product.id);
    };

    expect(await productIdsFor('vessel Maker')).toContain(workId);
    expect(await productIdsFor('Alpha parent-maker-work')).toContain(workId);
    expect(await productIdsFor('Hidden parent name')).not.toContain(workId);
    expect(await productIdsFor('Blank Discipline')).toContain(blankWorkId);
    expect(await productIdsFor('missing-title')).not.toContain(blankWorkId);
    expect(await productIdsFor('Edited vessel')).toContain(revisedWorkId);
    expect(await productIdsFor('Old parent title')).not.toContain(
      revisedWorkId,
    );
  });
});

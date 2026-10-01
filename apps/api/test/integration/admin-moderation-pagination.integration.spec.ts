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
  revision?: {
    id: string;
    fullName: string;
    status: 'PENDING_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED';
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
      discipline: 'Керамика',
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
      slug: `${input.slug}-revision`,
      fullName: input.revision.fullName,
      discipline: 'Керамика',
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
  title: string;
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
});

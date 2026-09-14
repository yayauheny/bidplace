import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { PrismaClient } from '@bidplace/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;
const repositoryRoot = resolve(__dirname, '../../../..');
const seedPath = resolve(repositoryRoot, 'packages/database/prisma/seed.js');
const fixtureRoot = resolve(
  repositoryRoot,
  'packages/database/prisma/fixtures',
);

function fixtureChecksum(relativePath: string): string {
  return createHash('sha256')
    .update(readFileSync(resolve(fixtureRoot, relativePath)))
    .digest('hex');
}

function runSeed(options: { nodeEnv: string; appEnv: string }): void {
  execFileSync(process.execPath, [seedPath], {
    cwd: resolve(repositoryRoot, 'packages/database'),
    env: {
      ...process.env,
      NODE_ENV: options.nodeEnv,
      APP_ENV: options.appEnv,
      DATABASE_URL: context.databaseUrl,
      ALLOW_DESTRUCTIVE_DEMO_SEED: 'true',
      SEED_ADMIN_EMAIL: 'seed-contract-admin@bidplace.test',
      SEED_ADMIN_PASSWORD: 'seed-contract-fixture-password',
    },
    stdio: 'pipe',
  });
}

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});

afterAll(async () => context?.cleanup());

describe('demo seed executable contract', () => {
  it('creates the Figma local catalog without commerce fixtures', async () => {
    runSeed({ nodeEnv: 'test', appEnv: 'local' });

    const [
      listings,
      bids,
      orders,
      vex,
      pixelp,
      catalogAuthors,
      dali,
      curator,
      publishedRevisions,
      pending,
    ] = await Promise.all([
      prisma.listing.count(),
      prisma.bid.count(),
      prisma.order.count(),
      prisma.sellerProfile.findUnique({
        where: { slug: 'vex' },
        include: {
          publishedRevision: {
            include: { achievements: { orderBy: { position: 'asc' } } },
          },
          products: { select: { id: true } },
        },
      }),
      prisma.sellerProfile.findUnique({
        where: { slug: 'pixelp' },
        select: {
          id: true,
          fullName: true,
          createdAt: true,
          discipline: true,
          biography: true,
          profilePhotoByteLength: true,
          publishedRevision: {
            include: { achievements: { orderBy: { position: 'asc' } } },
          },
        },
      }),
      prisma.sellerProfile.findMany({
        where: {
          slug: { in: ['vex', 'quantumparadox', 'havoc', 'bala_klava'] },
        },
        select: { slug: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findUnique({
        where: { publicId: 'daliEstate1' },
        select: {
          publicId: true,
          status: true,
          story: true,
          technique: true,
          materials: true,
          sellerProfile: { select: { slug: true } },
          images: {
            orderBy: { position: 'asc' },
            select: { position: true, checksum: true },
          },
        },
      }),
      prisma.curatorSelection.findUnique({
        where: { slot: 'home' },
        include: {
          product: { select: { publicId: true, status: true } },
          curator: { select: { slug: true } },
        },
      }),
      prisma.sellerProfileRevision.count({
        where: { status: 'APPROVED' },
      }),
      prisma.sellerProfile.findUnique({
        where: { slug: 'pending-seller' },
        select: { status: true, city: true },
      }),
    ]);

    expect(listings).toBe(0);
    expect(bids).toBe(0);
    expect(orders).toBe(0);
    expect(vex?.fullName).toBe('Илья Васильев');
    expect(vex?.shortDescription).toContain('Ищу логику в абсурде');
    expect(vex?.biography).toContain('художник из Минска');
    expect(vex?.products).toHaveLength(2);
    expect(vex?.publishedRevision?.achievements).toHaveLength(2);
    const vexAchievementChecksums =
      vex?.publishedRevision?.achievements.map((item) => item.checksum) ?? [];
    expect(vexAchievementChecksums).toEqual([
      fixtureChecksum('product-images/alice-glass-detail.png'),
      fixtureChecksum('product-images/between-form-detail.png'),
    ]);
    expect(
      vex?.publishedRevision?.achievements.every(
        (item) =>
          item.objectKey === `seller-achievement:${item.id}` &&
          item.mimeType === 'image/png' &&
          (item.byteLength ?? 0) > 10_000,
      ),
    ).toBe(true);
    expect(vexAchievementChecksums).not.toContain(
      fixtureChecksum('product-images/alice-glass.png'),
    );
    expect(vexAchievementChecksums).not.toContain(
      fixtureChecksum('product-images/between-form.png'),
    );
    expect(new Set(vexAchievementChecksums).size).toBe(2);
    expect(
      new Set(
        vex?.publishedRevision?.achievements.map((item) => item.body) ?? [],
      ).size,
    ).toBe(2);
    expect(pixelp?.fullName).toBe('Павел Пиксель');
    expect(pixelp?.discipline).toBe('Художник');
    expect(pixelp?.biography).toContain('живописью и цифровыми образами');
    expect(pixelp?.profilePhotoByteLength ?? 0).toBeGreaterThan(10_000);
    expect(pixelp?.publishedRevision?.achievements).toHaveLength(1);
    expect(pixelp?.publishedRevision?.achievements[0]).toMatchObject({
      checksum: fixtureChecksum(
        'seller-achievements/pixelp-after-classics.png',
      ),
      mimeType: 'image/png',
    });
    expect(
      pixelp?.publishedRevision?.achievements[0]?.objectKey,
    ).toBe(
      `seller-achievement:${pixelp?.publishedRevision?.achievements[0]?.id}`,
    );
    expect(pixelp?.publishedRevision?.achievements[0]?.checksum).not.toBe(
      fixtureChecksum('product-images/dali-estate.png'),
    );
    expect(pixelp?.publishedRevision?.achievements[0]?.checksum).not.toBe(
      vexAchievementChecksums[0],
    );
    const publicCopyMarker =
      /Demo copy|invented|not in Figma|placeholder|test fixture|\bseed\b|\bmock\b/i;
    expect(dali?.story).not.toMatch(publicCopyMarker);
    for (const row of await prisma.product.findMany({
      select: {
        title: true,
        story: true,
        technique: true,
        materials: true,
        uniqueness: true,
      },
    })) {
      expect(
        `${row.title}\n${row.story}\n${row.technique}\n${row.materials}\n${row.uniqueness ?? ''}`,
      ).not.toMatch(publicCopyMarker);
    }
    for (const row of await prisma.sellerProfile.findMany({
      where: { status: 'APPROVED' },
      select: {
        fullName: true,
        biography: true,
        shortDescription: true,
        practice: true,
        discipline: true,
        publishedRevision: {
          select: { achievements: { select: { body: true } } },
        },
      },
    })) {
      const achievements = (row.publishedRevision?.achievements ?? [])
        .map((item) => item.body)
        .join('\n');
      expect(
        `${row.fullName}\n${row.biography ?? ''}\n${row.shortDescription ?? ''}\n${row.practice ?? ''}\n${row.discipline ?? ''}\n${achievements}`,
      ).not.toMatch(publicCopyMarker);
    }
    expect(dali?.technique).toBe('Живопись');
    expect(dali?.materials).toBe('Холст, масло');
    expect(catalogAuthors.map((author) => author.slug)).toEqual([
      'vex',
      'quantumparadox',
      'havoc',
      'bala_klava',
    ]);
    expect(pixelp?.createdAt.getTime()).toBeLessThan(
      catalogAuthors.at(-1)?.createdAt.getTime() ?? 0,
    );
    expect(dali?.sellerProfile.slug).toBe('pixelp');
    expect(dali?.status).toBe('APPROVED');
    expect(dali?.images.map((image) => image.checksum)).toEqual([
      fixtureChecksum('product-images/dali-estate.png'),
      fixtureChecksum('product-images/dali-estate-detail.png'),
    ]);
    expect(
      await prisma.product.findUnique({
        where: { publicId: 'sleepForm01' },
        select: {
          images: {
            orderBy: { position: 'asc' },
            select: { checksum: true },
          },
        },
      }),
    ).toMatchObject({
      images: [
        { checksum: fixtureChecksum('product-images/between-form.png') },
        { checksum: fixtureChecksum('product-images/between-form-detail.png') },
      ],
    });
    expect(
      await prisma.product.findUnique({
        where: { publicId: 'aliceGlass1' },
        select: { sellerProfile: { select: { slug: true } } },
      }),
    ).toMatchObject({ sellerProfile: { slug: 'vex' } });
    expect(curator?.product.publicId).toBe('daliEstate1');
    expect(curator?.curator.slug).toBe('vex');
    expect(curator?.note).toContain('безупречная техника');
    expect(curator?.product.status).toBe('APPROVED');
    expect(publishedRevisions).toBeGreaterThan(0);
    expect(pending?.status).toBe('PENDING_REVIEW');
    expect(pending?.city).toBeNull();
    expect(
      await prisma.user.findUnique({
        where: { email: 'buyer@bidplace.test' },
        select: { id: true },
      }),
    ).not.toBeNull();
    expect(await prisma.productRevision.count()).toBeGreaterThan(0);
  });

  it.each([
    { nodeEnv: 'production', appEnv: 'production' },
    { nodeEnv: 'test', appEnv: 'production' },
    { nodeEnv: 'development', appEnv: 'production' },
  ])(
    'denies demo bids for production-like profile $nodeEnv/$appEnv before any write',
    ({ nodeEnv, appEnv }) => {
      expect(() => runSeed({ nodeEnv, appEnv })).toThrow(
        'Refusing demo-bid seed outside an explicitly allowed local/test profile',
      );
    },
  );

  it('keeps the seeded database unchanged after production-like denial', async () => {
    const before = {
      products: await prisma.product.count(),
      authors: await prisma.sellerProfile.count(),
    };

    expect(() =>
      runSeed({ nodeEnv: 'production', appEnv: 'production' }),
    ).toThrow();

    expect(await prisma.product.count()).toBe(before.products);
    expect(await prisma.sellerProfile.count()).toBe(before.authors);
  });
});

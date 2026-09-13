import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import type { PrismaClient } from '@bidplace/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

const requireFromHere = createRequire(__filename);
const {
  FIGMA_COMPARISON_SLUG,
  MANIFEST,
  syncFigmaComparisonFixture,
} = requireFromHere(
  '../../../../packages/database/prisma/figma-comparison-fixture.js',
) as {
  FIGMA_COMPARISON_SLUG: string;
  MANIFEST: {
    author: {
      fullName: string;
      city: string;
      country: string;
      discipline: string;
      shortDescription: string;
      practice: string;
      profilePhoto: { checksum: string };
    };
    curatorSelectionPublicId: string;
    works: Array<{ publicId: string; title: string; checksum: string }>;
    achievements: Array<{ body: string; checksum?: string }>;
  };
  syncFigmaComparisonFixture: (prisma: PrismaClient) => Promise<unknown>;
};

const repositoryRoot = resolve(__dirname, '../../../..');
const seedPath = resolve(repositoryRoot, 'packages/database/prisma/seed.js');
const syncPath = resolve(
  repositoryRoot,
  'packages/database/prisma/sync-figma-comparison-fixture.js',
);

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;

function runSeed(): void {
  execFileSync(process.execPath, [seedPath], {
    cwd: resolve(repositoryRoot, 'packages/database'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      APP_ENV: 'local',
      DATABASE_URL: context.databaseUrl,
      ALLOW_DESTRUCTIVE_DEMO_SEED: 'true',
      SEED_ADMIN_EMAIL: 'seed-contract-admin@bidplace.test',
      SEED_ADMIN_PASSWORD: 'seed-contract-fixture-password',
    },
    stdio: 'pipe',
  });
}

function runSyncCli(env: NodeJS.ProcessEnv): string {
  return execFileSync(process.execPath, [syncPath], {
    cwd: resolve(repositoryRoot, 'packages/database'),
    env,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function assertPublicPayload(payload: unknown): void {
  const serialized = JSON.stringify(payload);
  expect(serialized).not.toMatch(/handoff/i);
  expect(serialized).not.toContain('socialLink');
  expect(serialized).not.toContain('passwordHash');
  expect(serialized).not.toContain('vex@bidplace.test');
  expect(serialized).not.toContain('@vex_private');
  expect(serialized).not.toMatch(/1 450 BYN|13д 24ч|В продаже/);
}

async function sha256OfResponse(response: Response): Promise<string> {
  return createHash('sha256')
    .update(Buffer.from(await response.arrayBuffer()))
    .digest('hex');
}

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});

afterAll(async () => context?.cleanup());

describe('figma comparison fixture executable guards', () => {
  it('prints only the disposable database name and refuses the shared bidplace database', () => {
    expect(() =>
      runSyncCli({
        ...process.env,
        NODE_ENV: 'test',
        APP_ENV: 'local',
        ALLOW_FIGMA_COMPARISON_FIXTURE: 'true',
        DATABASE_URL: 'postgresql://auction:auction@127.0.0.1:5432/bidplace',
      }),
    ).toThrow('Refusing Figma comparison fixture for non-disposable database "bidplace"');
  });

  it('denies production-like profiles before any write', () => {
    expect(() =>
      runSyncCli({
        ...process.env,
        NODE_ENV: 'production',
        APP_ENV: 'production',
        ALLOW_FIGMA_COMPARISON_FIXTURE: 'true',
        DATABASE_URL: context.databaseUrl,
      }),
    ).toThrow('Refusing Figma comparison fixture outside an explicitly allowed local/test profile');
  });
});

describe('figma comparison fixture sync and public HTTP', () => {
  let http: HttpTestApp;
  let guest: HttpTestClient;
  let annaCityBefore: string | null;

  beforeAll(async () => {
    runSeed();
    const anna = await prisma.sellerProfile.findUniqueOrThrow({
      where: { slug: 'anna-morozova' },
      select: { city: true, fullName: true },
    });
    annaCityBefore = anna.city;
    await prisma.sellerProfile.update({
      where: { slug: 'anna-morozova' },
      data: { city: 'Гродно' },
    });

    const first = runSyncCli({
      ...process.env,
      NODE_ENV: 'test',
      APP_ENV: 'local',
      ALLOW_FIGMA_COMPARISON_FIXTURE: 'true',
      DATABASE_URL: context.databaseUrl,
    });
    expect(first).toContain('Target disposable database:');
    expect(first).not.toContain('://');
    expect(first).not.toContain('auction:auction');

    await prisma.sellerProfile.update({
      where: { slug: FIGMA_COMPARISON_SLUG },
      data: { fullName: 'Не должен остаться' },
    });
    await syncFigmaComparisonFixture(prisma);

    http = await createHttpTestApp(context.databaseUrl, 'http://localhost:8081');
    guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
  });

  afterAll(async () => {
    await http?.close();
  });

  it('updates only the scoped demo fixture and is idempotent', async () => {
    const anna = await prisma.sellerProfile.findUniqueOrThrow({
      where: { slug: 'anna-morozova' },
    });
    expect(anna.city).toBe('Гродно');
    expect(anna.fullName).toBe('Анна Морозова');
    expect(annaCityBefore).toBe('Минск');

    const vex = await prisma.sellerProfile.findUniqueOrThrow({
      where: { slug: FIGMA_COMPARISON_SLUG },
      include: {
        publishedRevision: true,
        products: { select: { publicId: true } },
      },
    });
    expect(vex.fullName).toBe(MANIFEST.author.fullName);
    expect(vex.publishedRevision?.fullName).toBe(MANIFEST.author.fullName);
    expect(vex.publishedRevision?.shortDescription).toBe(
      MANIFEST.author.shortDescription,
    );
    expect(vex.publishedRevision?.practice).toBe(MANIFEST.author.practice);
    expect(vex.publishedRevision?.discipline).toBe(MANIFEST.author.discipline);
    expect(vex.city).toBe(MANIFEST.author.city);
    expect(vex.country).toBe(MANIFEST.author.country);

    const approvedBefore = await prisma.sellerProfile.count({
      where: { status: 'APPROVED' },
    });
    await syncFigmaComparisonFixture(prisma);
    expect(
      await prisma.sellerProfile.count({ where: { status: 'APPROVED' } }),
    ).toBe(approvedBefore);
    expect(
      await prisma.product.count({
        where: { publicId: { in: MANIFEST.works.map((work) => work.publicId) } },
      }),
    ).toBe(4);
  });

  it('returns public comparison data, curator selection, checksums and no private fields', async () => {
    const homeResponse = await guest.get('/portfolio/home');
    expect(homeResponse.status).toBe(200);
    const home = (await homeResponse.json()) as {
      curatorSelection: {
        work: { publicId: string; title: string; images: Array<{ id: string; url: string; checksum: string }> };
        author: { slug: string };
      } | null;
    };
    expect(home.curatorSelection?.author.slug).toBe(FIGMA_COMPARISON_SLUG);
    expect(home.curatorSelection?.work.publicId).toBe(
      MANIFEST.curatorSelectionPublicId,
    );
    expect(home.curatorSelection?.work.title).toBe(MANIFEST.works[0]?.title);
    assertPublicPayload(home);

    const authorResponse = await guest.get(`/authors/${FIGMA_COMPARISON_SLUG}`);
    expect(authorResponse.status).toBe(200);
    const author = (await authorResponse.json()) as {
      author: {
        slug: string;
        fullName: string;
        city: string;
        country: string;
        discipline: string;
        shortDescription: string;
        practice: string;
        profilePhotoUrl: string;
        achievements: Array<{
          body: string;
          image: { url: string; checksum: string } | null;
        }>;
      };
      works: Array<{ work: { publicId: string } }>;
    };
    expect(author.author.slug).toBe('vex');
    expect(author.author.fullName).toBe(MANIFEST.author.fullName);
    expect(author.author.city).toBe(MANIFEST.author.city);
    expect(author.author.country).toBe(MANIFEST.author.country);
    expect(author.author.discipline).toBe(MANIFEST.author.discipline);
    expect(author.author.shortDescription).toBe(
      MANIFEST.author.shortDescription,
    );
    expect(author.author.practice).toBe(MANIFEST.author.practice);
    expect(author.author.profilePhotoUrl).toBe('/api/sellers/vex/photo');
    expect(author.works.map((item) => item.work.publicId).sort()).toEqual(
      MANIFEST.works.map((work) => work.publicId).sort(),
    );
    expect(author.author.achievements.map((item) => item.body)).toEqual(
      MANIFEST.achievements.map((item) => item.body),
    );
    assertPublicPayload(author);

    const photoResponse = await guest.get('/sellers/vex/photo');
    expect(photoResponse.status).toBe(200);
    expect(await sha256OfResponse(photoResponse)).toBe(
      MANIFEST.author.profilePhoto.checksum,
    );

    for (const expected of MANIFEST.works) {
      const workResponse = await guest.get(`/works/${expected.publicId}`);
      expect(workResponse.status).toBe(200);
      const work = (await workResponse.json()) as {
        work: {
          publicId: string;
          title: string;
          images: Array<{ id: string; url: string; checksum: string }>;
        };
        author: { slug: string };
        relatedWorks: Array<{ work: { publicId: string } }>;
      };
      expect(work.author.slug).toBe('vex');
      expect(work.work.title).toBe(expected.title);
      expect(work.work.images[0]?.checksum).toBe(expected.checksum);
      expect(
        work.relatedWorks.map((item) => item.work.publicId),
      ).not.toContain(expected.publicId);
      assertPublicPayload(work);

      const imageResponse = await guest.get(
        work.work.images[0].url.replace(/^\/api/, ''),
      );
      expect(imageResponse.status).toBe(200);
      expect(await sha256OfResponse(imageResponse)).toBe(expected.checksum);
    }

    const photoAchievements = author.author.achievements.filter(
      (item) => item.image,
    );
    expect(photoAchievements).toHaveLength(2);
    for (const [index, item] of photoAchievements.entries()) {
      const expected = MANIFEST.achievements[index];
      expect(item.image?.checksum).toBe(expected?.checksum);
      const imageResponse = await guest.get(
        item.image!.url.replace(/^\/api/, ''),
      );
      expect(imageResponse.status).toBe(200);
      expect(await sha256OfResponse(imageResponse)).toBe(expected?.checksum);
    }
  });
});

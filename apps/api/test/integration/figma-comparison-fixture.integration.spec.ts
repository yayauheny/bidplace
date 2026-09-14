import { createHash, randomUUID } from 'node:crypto';
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
  syncFigmaComparisonFixture: (
    prisma:
      | PrismaClient
      | { $queryRaw: (...args: unknown[]) => Promise<unknown> },
    env?: NodeJS.ProcessEnv,
  ) => Promise<{
    profilePhotoChecksum: string;
    works: Array<{ publicId: string; checksum: string }>;
    achievementChecksums: string[];
    curatorSelectionPublicId: string;
  }>;
};

const localFixtureEnv = {
  NODE_ENV: 'test',
  APP_ENV: 'local',
  ALLOW_FIGMA_COMPARISON_FIXTURE: 'true',
} as const;

const repositoryRoot = resolve(__dirname, '../../../..');
const syncPath = resolve(
  repositoryRoot,
  'packages/database/prisma/sync-figma-comparison-fixture.js',
);
const SENTINEL_SLUG = 'sentinel-author';

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;

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
  it('refuses the shared bidplace database before any write', () => {
    expect(() =>
      runSyncCli({
        ...process.env,
        NODE_ENV: 'test',
        APP_ENV: 'local',
        ALLOW_FIGMA_COMPARISON_FIXTURE: 'true',
        DATABASE_URL: 'postgresql://auction:auction@127.0.0.1:5432/bidplace',
      }),
    ).toThrow(
      'Refusing Figma comparison fixture for non-disposable database "bidplace"',
    );
  });

  it('refuses bidplace_e2e before any write', () => {
    expect(() =>
      runSyncCli({
        ...process.env,
        NODE_ENV: 'test',
        APP_ENV: 'local',
        ALLOW_FIGMA_COMPARISON_FIXTURE: 'true',
        DATABASE_URL:
          'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e',
      }),
    ).toThrow(
      'Refusing Figma comparison fixture for non-disposable database "bidplace_e2e"',
    );
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
    ).toThrow(
      'Refusing Figma comparison fixture outside an explicitly allowed local/test profile',
    );
  });
});

describe('figma comparison fixture programmatic guards', () => {
  it('refuses production-like profiles before any write', async () => {
    await expect(
      syncFigmaComparisonFixture(prisma, {
        NODE_ENV: 'production',
        APP_ENV: 'production',
        ALLOW_FIGMA_COMPARISON_FIXTURE: 'true',
      }),
    ).rejects.toThrow(
      'Refusing Figma comparison fixture outside an explicitly allowed local/test profile',
    );
  });

  it('refuses the shared bidplace database from the connected session', async () => {
    await expect(
      syncFigmaComparisonFixture(
        { $queryRaw: async () => [{ name: 'bidplace' }] },
        { ...localFixtureEnv },
      ),
    ).rejects.toThrow(
      'Refusing Figma comparison fixture for non-disposable database "bidplace"',
    );
  });

  it('refuses bidplace_e2e from the connected session', async () => {
    await expect(
      syncFigmaComparisonFixture(
        { $queryRaw: async () => [{ name: 'bidplace_e2e' }] },
        { ...localFixtureEnv },
      ),
    ).rejects.toThrow(
      'Refusing Figma comparison fixture for non-disposable database "bidplace_e2e"',
    );
  });
});

describe('figma comparison fixture sync and public HTTP', () => {
  let http: HttpTestApp;
  let guest: HttpTestClient;
  let firstApply: Awaited<ReturnType<typeof syncFigmaComparisonFixture>>;
  let secondApply: Awaited<ReturnType<typeof syncFigmaComparisonFixture>>;

  beforeAll(async () => {
    const suffix = randomUUID();
    const sentinelUser = await prisma.user.create({
      data: {
        email: `sentinel.${suffix}@bidplace.test`,
        passwordHash: 'test',
        displayName: 'Sentinel',
      },
    });
    await prisma.sellerProfile.create({
      data: {
        userId: sentinelUser.id,
        slug: SENTINEL_SLUG,
        sellerType: 'creator',
        fullName: 'Sentinel Author',
        country: 'BY',
        city: 'Гродно',
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: 1,
        profilePhotoChecksum: '1'.repeat(64),
        profilePhotoData: Buffer.from([1]),
        socialLink: 'https://example.com/sentinel',
        shortDescription: 'Must stay untouched by the Vex fixture',
        handoffContactType: 'TELEGRAM',
        handoffContactValue: '@sentinel',
        status: 'APPROVED',
      },
    });

    firstApply = await syncFigmaComparisonFixture(prisma, {
      ...process.env,
      ...localFixtureEnv,
    });
    await prisma.sellerProfile.update({
      where: { slug: FIGMA_COMPARISON_SLUG },
      data: { fullName: 'Не должен остаться' },
    });
    secondApply = await syncFigmaComparisonFixture(prisma, {
      ...process.env,
      ...localFixtureEnv,
    });

    http = await createHttpTestApp(context.databaseUrl, 'http://localhost:8081');
    guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
  });

  afterAll(async () => {
    await http?.close();
  });

  it('applies twice on a disposable database without seed and stays idempotent', async () => {
    const sentinel = await prisma.sellerProfile.findUniqueOrThrow({
      where: { slug: SENTINEL_SLUG },
    });
    expect(sentinel.fullName).toBe('Sentinel Author');
    expect(sentinel.city).toBe('Гродно');

    expect(firstApply.profilePhotoChecksum).toBe(
      MANIFEST.author.profilePhoto.checksum,
    );
    expect(secondApply.profilePhotoChecksum).toBe(
      firstApply.profilePhotoChecksum,
    );
    expect(secondApply.works.map((work) => work.checksum)).toEqual(
      firstApply.works.map((work) => work.checksum),
    );
    expect(secondApply.achievementChecksums).toEqual(
      firstApply.achievementChecksums,
    );
    expect(secondApply.curatorSelectionPublicId).toBe(
      firstApply.curatorSelectionPublicId,
    );

    expect(
      await prisma.product.count({
        where: { publicId: { in: MANIFEST.works.map((work) => work.publicId) } },
      }),
    ).toBe(4);
    expect(await prisma.sellerProfile.count({ where: { slug: 'anna-morozova' } })).toBe(
      0,
    );
  });

  it('returns public comparison data, curator selection, checksums and no private fields', async () => {
    const homeResponse = await guest.get('/portfolio/home');
    expect(homeResponse.status).toBe(200);
    const home = (await homeResponse.json()) as {
      curatorSelection: {
        work: {
          publicId: string;
          title: string;
          images: Array<{ id: string; url: string; checksum: string }>;
        };
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

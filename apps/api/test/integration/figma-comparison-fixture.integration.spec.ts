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
const { FIGMA_COMPARISON_SLUG, MANIFEST, syncFigmaComparisonFixture } =
  requireFromHere(
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
        profilePhoto: { checksum: string; fileName: string };
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
      databaseUrl?: string,
    ) => Promise<{
      profilePhotoChecksum: string;
      works: Array<{ publicId: string; checksum: string }>;
      achievementChecksums: string[];
      curatorSelectionPublicId: string;
    }>;
  };
const { assertConnectedFigmaComparisonTarget, assertFigmaComparisonTarget } =
  requireFromHere(
    '../../../../packages/database/prisma/figma-comparison-target.js',
  ) as {
    assertConnectedFigmaComparisonTarget: (
      prisma: { $queryRaw: (...args: unknown[]) => Promise<unknown> },
      env?: NodeJS.ProcessEnv,
      databaseUrl?: string,
    ) => Promise<{ databaseName: string; schemaName: string }>;
    assertFigmaComparisonTarget: (
      databaseUrl: string,
      env?: NodeJS.ProcessEnv,
    ) => { databaseName: string; schemaName: string };
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

function runSyncCli(env: NodeJS.ProcessEnv, args: string[] = []): string {
  return execFileSync(process.execPath, [syncPath, ...args], {
    cwd: resolve(repositoryRoot, 'packages/database'),
    env,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function refuseTarget(databaseName: string, schemaName = 'public'): string {
  return `Refusing Figma comparison fixture for database "${databaseName}" schema "${schemaName}"`;
}

function localCliEnv(databaseUrl: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    NODE_ENV: 'test',
    APP_ENV: 'local',
    ALLOW_FIGMA_COMPARISON_FIXTURE: 'true',
    DATABASE_URL: databaseUrl,
  };
}

function mockConnected(databaseName: string, schemaName: string) {
  return {
    $queryRaw: async () => [
      { database_name: databaseName, schema_name: schemaName },
    ],
  };
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
  it.each([
    ['bidplace', 'postgresql://auction:auction@127.0.0.1:5432/bidplace'],
    [
      'bidplace_e2e',
      'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e',
    ],
    ['postgres', 'postgresql://auction:auction@127.0.0.1:5432/postgres'],
    [
      'foo_test_prod',
      'postgresql://auction:auction@127.0.0.1:5432/foo_test_prod',
    ],
    [
      'production_preview',
      'postgresql://auction:auction@127.0.0.1:5432/production_preview',
    ],
    [
      'stage_integration',
      'postgresql://auction:auction@127.0.0.1:5432/stage_integration',
    ],
  ])('refuses %s before any write', (_name, databaseUrl) => {
    expect(() => runSyncCli(localCliEnv(databaseUrl))).toThrow(
      refuseTarget(_name),
    );
  });

  it('refuses bidplace_integration unless the URL schema is itest_*', () => {
    expect(() =>
      runSyncCli(
        localCliEnv(
          'postgresql://auction:auction@127.0.0.1:5432/bidplace_integration',
        ),
        ['--print-target-only'],
      ),
    ).toThrow(refuseTarget('bidplace_integration', 'public'));
  });

  it('accepts allowlisted URL targets without connecting', () => {
    expect(
      runSyncCli(
        localCliEnv(
          'postgresql://auction:auction@127.0.0.1:5432/bidplace_figma_comparison',
        ),
        ['--print-target-only'],
      ),
    ).toContain(
      'Target allowlisted database: bidplace_figma_comparison schema public',
    );
    expect(
      runSyncCli(
        localCliEnv(
          'postgresql://auction:auction@127.0.0.1:5432/bidplace_integration?schema=itest_abc123',
        ),
        ['--print-target-only'],
      ),
    ).toContain(
      'Target allowlisted database: bidplace_integration schema itest_abc123',
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
  it.each([
    ['bidplace', 'postgresql://auction:auction@127.0.0.1:5432/bidplace'],
    [
      'bidplace_e2e',
      'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e',
    ],
    ['postgres', 'postgresql://auction:auction@127.0.0.1:5432/postgres'],
    [
      'foo_test_prod',
      'postgresql://auction:auction@127.0.0.1:5432/foo_test_prod',
    ],
    [
      'production_preview',
      'postgresql://auction:auction@127.0.0.1:5432/production_preview',
    ],
    [
      'stage_integration',
      'postgresql://auction:auction@127.0.0.1:5432/stage_integration',
    ],
  ])('refuses URL %s before connecting', (_name, databaseUrl) => {
    expect(() =>
      assertFigmaComparisonTarget(databaseUrl, { ...localFixtureEnv }),
    ).toThrow(refuseTarget(_name));
  });

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

  it.each([
    ['bidplace', 'public'],
    ['bidplace_e2e', 'public'],
    ['postgres', 'public'],
    ['foo_test_prod', 'public'],
    ['production_preview', 'public'],
    ['stage_integration', 'public'],
    ['bidplace_integration', 'public'],
    ['bidplace_figma_comparison', 'itest_abc123'],
  ])(
    'refuses connected %s schema %s before asset reads',
    async (databaseName, schemaName) => {
      await expect(
        syncFigmaComparisonFixture(mockConnected(databaseName, schemaName), {
          ...localFixtureEnv,
        }),
      ).rejects.toThrow(refuseTarget(databaseName, schemaName));
    },
  );

  it('refuses a URL that does not match the connected database', async () => {
    await expect(
      assertConnectedFigmaComparisonTarget(
        mockConnected('bidplace_integration', 'itest_abc123'),
        { ...localFixtureEnv },
        'postgresql://auction:auction@127.0.0.1:5432/bidplace_figma_comparison?schema=public',
      ),
    ).rejects.toThrow(
      'Refusing Figma comparison fixture because DATABASE_URL targets "bidplace_figma_comparison" schema "public" but the connected session is "bidplace_integration" schema "itest_abc123"',
    );
  });

  it('refuses a URL that does not match the connected schema', async () => {
    await expect(
      assertConnectedFigmaComparisonTarget(
        mockConnected('bidplace_integration', 'itest_abc123'),
        { ...localFixtureEnv },
        'postgresql://auction:auction@127.0.0.1:5432/bidplace_integration?schema=itest_other',
      ),
    ).rejects.toThrow(
      'Refusing Figma comparison fixture because DATABASE_URL targets "bidplace_integration" schema "itest_other" but the connected session is "bidplace_integration" schema "itest_abc123"',
    );
  });

  it('refuses when the live session does not match an allowlisted URL', async () => {
    await expect(
      syncFigmaComparisonFixture(
        prisma,
        { ...localFixtureEnv },
        'postgresql://auction:auction@127.0.0.1:5432/bidplace_figma_comparison?schema=public',
      ),
    ).rejects.toThrow(
      /DATABASE_URL targets "bidplace_figma_comparison" schema "public" but the connected session is "bidplace_integration" schema "itest_/,
    );
  });

  it('refuses when the live schema does not match the URL schema', async () => {
    const url = new URL(context.databaseUrl);
    url.searchParams.set('schema', 'itest_other');
    await expect(
      syncFigmaComparisonFixture(
        prisma,
        { ...localFixtureEnv },
        url.toString(),
      ),
    ).rejects.toThrow(
      `DATABASE_URL targets "bidplace_integration" schema "itest_other" but the connected session is "bidplace_integration" schema "${context.schemaName}"`,
    );
  });

  it('accepts the connected integration schema without a URL', async () => {
    await expect(
      assertConnectedFigmaComparisonTarget(prisma, { ...localFixtureEnv }),
    ).resolves.toEqual({
      databaseName: 'bidplace_integration',
      schemaName: context.schemaName,
    });
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

    http = await createHttpTestApp(
      context.databaseUrl,
      'http://localhost:8081',
    );
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
        where: {
          publicId: { in: MANIFEST.works.map((work) => work.publicId) },
        },
      }),
    ).toBe(4);
    expect(
      await prisma.sellerProfile.count({ where: { slug: 'anna-morozova' } }),
    ).toBe(0);
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
      expect(work.relatedWorks.map((item) => item.work.publicId)).not.toContain(
        expected.publicId,
      );
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

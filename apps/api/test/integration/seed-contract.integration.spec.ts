import { execFileSync } from 'node:child_process';
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

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;
const repositoryRoot = resolve(__dirname, '../../../..');
const seedPath = resolve(repositoryRoot, 'packages/database/prisma/seed.js');

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
  it('creates published portfolio works without listings, bids, or orders', async () => {
    runSeed({ nodeEnv: 'test', appEnv: 'local' });

    const [
      listings,
      bids,
      orders,
      approvedAuthors,
      publishedWorks,
      categories,
      creationSteps,
      visitor,
      buyer,
    ] = await Promise.all([
      prisma.listing.count(),
      prisma.bid.count(),
      prisma.order.count(),
      prisma.sellerProfile.count({ where: { status: 'APPROVED' } }),
      prisma.product.count({ where: { status: 'APPROVED' } }),
      prisma.category.count(),
      prisma.productCreationStep.count(),
      prisma.user.count({ where: { email: 'visitor@bidplace.test' } }),
      prisma.user.count({ where: { email: 'buyer@bidplace.test' } }),
    ]);

    expect(listings).toBe(0);
    expect(bids).toBe(0);
    expect(orders).toBe(0);
    expect(approvedAuthors).toBe(8);
    expect(publishedWorks).toBe(15);
    expect(categories).toBe(3);
    expect(creationSteps).toBe(64);
    expect(visitor).toBe(1);
    expect(buyer).toBe(0);

    const emptyAuthors = await prisma.sellerProfile.count({
      where: {
        status: 'APPROVED',
        products: { none: { status: 'APPROVED' } },
      },
    });
    expect(emptyAuthors).toBe(0);

    const annaPlanter = await prisma.product.findUniqueOrThrow({
      where: { publicId: 'seedAnna001' },
      include: { creationSteps: true },
    });
    expect(annaPlanter.packaging).toBeNull();
    expect(annaPlanter.deliveryInfo).toBeNull();
    expect(annaPlanter.condition).toBeNull();
    expect(annaPlanter.creationIntro).toBeTruthy();
    expect(annaPlanter.creationSteps).toHaveLength(4);
  });

  it.each([
    { nodeEnv: 'production', appEnv: 'production' },
    { nodeEnv: 'test', appEnv: 'production' },
    { nodeEnv: 'development', appEnv: 'production' },
  ])(
    'denies demo seed for production-like profile $nodeEnv/$appEnv before any write',
    ({ nodeEnv, appEnv }) => {
      expect(() => runSeed({ nodeEnv, appEnv })).toThrow(
        'Refusing demo seed outside an explicitly allowed local/test profile',
      );
    },
  );

  it('keeps the seeded database unchanged after production-like denial', async () => {
    const before = {
      bids: await prisma.bid.count(),
      orders: await prisma.order.count(),
    };

    expect(() =>
      runSeed({ nodeEnv: 'production', appEnv: 'production' }),
    ).toThrow();

    expect(await prisma.bid.count()).toBe(before.bids);
    expect(await prisma.order.count()).toBe(before.orders);
  });
});

describe('demo seed public portfolio HTTP', () => {
  let http: HttpTestApp;
  let guest: HttpTestClient;

  beforeAll(async () => {
    runSeed({ nodeEnv: 'test', appEnv: 'local' });
    http = await createHttpTestApp(context.databaseUrl, 'http://localhost:8081');
    guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
  });

  afterAll(async () => {
    await http?.close();
  });

  it('returns published authors, works, images and a visible curator selection', async () => {
    const homeResponse = await guest.get('/portfolio/home');
    expect(homeResponse.status).toBe(200);
    const home = (await homeResponse.json()) as {
      curatorSelection: { work: { publicId: string } } | null;
      newWorks: Array<{
        work: {
          publicId: string;
          uniqueness: string | null;
          images: Array<{ id: string; url: string }>;
        };
      }>;
      newAuthors: Array<{ slug: string }>;
    };
    expect(home.newWorks.length).toBeGreaterThan(0);
    expect(home.newAuthors.length).toBeGreaterThan(0);
    expect(home.newWorks[0]?.work.images[0]?.id).toBeTruthy();
    expect(home.newWorks[0]?.work.images[0]?.url).toMatch(/^\/api\/images\//);
    expect(home.curatorSelection?.work.publicId).toBe('seedAnna001');

    const authorsResponse = await guest.get('/authors?limit=20');
    expect(authorsResponse.status).toBe(200);
    const authors = (await authorsResponse.json()) as {
      authors: Array<{ author: { slug: string } }>;
      pagination: { total: number };
    };
    expect(authors.pagination.total).toBe(8);
    expect(authors.authors).toHaveLength(8);
    expect(authors.authors.map((item) => item.author.slug)).not.toContain(
      'pending-seller',
    );

    const worksResponse = await guest.get('/works?limit=20');
    expect(worksResponse.status).toBe(200);
    const works = (await worksResponse.json()) as {
      works: Array<{ work: { publicId: string } }>;
      pagination: { total: number };
    };
    expect(works.pagination.total).toBe(15);
    expect(works.works).toHaveLength(15);
    expect(works.works.map((item) => item.work.publicId)).not.toContain(
      'seedPend004',
    );

    const annaResponse = await guest.get('/authors/anna-morozova');
    expect(annaResponse.status).toBe(200);
    const anna = (await annaResponse.json()) as {
      author: {
        slug: string;
        city: string;
        achievements: Array<{ body: string }>;
      };
      pagination: { total: number };
    };
    expect(anna.author.slug).toBe('anna-morozova');
    expect(anna.author.city).toBe('Минск');
    expect(anna.author.achievements.length).toBeGreaterThan(0);
    expect(JSON.stringify(anna)).not.toMatch(/handoff/i);
    expect(JSON.stringify(anna)).not.toContain('socialLink');

    const workResponse = await guest.get('/works/seedAnna001');
    expect(workResponse.status).toBe(200);
    const work = (await workResponse.json()) as {
      work: {
        publicId: string;
        uniqueness: string | null;
        sharePath: string;
        images: Array<{ id: string; url: string }>;
      };
      relatedWorks: Array<{ work: { publicId: string } }>;
    };
    expect(work.work.publicId).toBe('seedAnna001');
    expect(work.work.uniqueness).toBe('Единственный экземпляр');
    expect(work.work.sharePath).toBe('/works/seedAnna001');
    expect(work.work.images[0]?.id).toBeTruthy();
    expect(work.work.images[0]?.url).toMatch(/^\/api\/images\//);
    expect(
      work.relatedWorks.map((item) => item.work.publicId),
    ).not.toContain('seedAnna001');
  });
});

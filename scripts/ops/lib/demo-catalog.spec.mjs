import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import {
  demoCatalog,
  fixtureImage,
  importDemoCatalog,
  validateDemoTarget,
} from './demo-catalog.mjs';

test('catalog has 12 distinct authors, 48 works and readable image fixtures', () => {
  const authors = demoCatalog();
  assert.equal(authors.length, 12);
  const works = authors.flatMap((author) => author.works);
  assert.equal(works.length, 48);
  for (const work of works) assert.match(work.publicId, /^[A-Za-z0-9_-]{11}$/);
  assert.equal(new Set(works.map((work) => work.publicId)).size, 48);
  assert.equal(new Set(authors.map((author) => author.email)).size, 12);
  for (const path of [
    ...authors.map((author) => author.photo),
    ...works.map((work) => work.image),
  ]) {
    const image = fixtureImage(path);
    assert.ok(image.width > 0 && image.height > 0);
    assert.equal(image.checksum.length, 64);
  }
});

test(
  'database import preserves existing users, publishes revisions, repeats safely and rolls back collisions',
  { skip: !process.env.DEMO_TEST_DATABASE_URL },
  async () => {
    const url = new URL(process.env.DEMO_TEST_DATABASE_URL);
    assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
    assert.match(url.pathname, /_test$/);
    const require = createRequire(
      new URL('../../../packages/database/package.json', import.meta.url),
    );
    const { PrismaClient } = require('./dist/index.js');
    const prisma = new PrismaClient({
      datasources: { db: { url: url.toString() } },
    });
    const upload = async () => {};
    try {
      const original = await prisma.user.create({
        data: { email: 'preserved@example.invalid', slug: 'preserved' },
      });
      assert.equal((await importDemoCatalog(prisma, upload)).dryRun, true);
      assert.equal(await prisma.user.count(), 1);
      await assert.rejects(
        importDemoCatalog(
          prisma,
          async () => {
            throw new Error('Storage unavailable');
          },
          { apply: true },
        ),
        /Storage unavailable/,
      );
      assert.equal(await prisma.user.count(), 1);
      assert.equal(await prisma.category.count(), 0);
      await importDemoCatalog(prisma, upload, { apply: true });
      await importDemoCatalog(prisma, upload, { apply: true });
      assert.equal(await prisma.user.count(), 13);
      assert.ok(await prisma.user.findUnique({ where: { id: original.id } }));
      assert.equal(
        await prisma.product.count({
          where: {
            status: 'APPROVED',
            publishedRevisionId: { not: null },
            publishedRevision: { images: { some: {} } },
          },
        }),
        48,
      );
      assert.equal(
        await prisma.sellerProfile.count({
          where: {
            publishedRevisionId: { not: null },
            user: { passwordHash: null, slug: { not: null } },
          },
        }),
        12,
      );
      const work = demoCatalog()[0].works[0];
      await prisma.product.update({
        where: { id: work.id },
        data: { title: 'Operator edit' },
      });
      await importDemoCatalog(prisma, upload, { apply: true });
      assert.equal(
        (await prisma.product.findUnique({ where: { id: work.id } })).title,
        'Operator edit',
      );
      await prisma.user.update({
        where: { id: original.id },
        data: { slug: 'collision' },
      });
      const author = demoCatalog()[0];
      await prisma.user.update({
        where: { id: author.userId },
        data: { email: 'changed@example.invalid' },
      });
      await assert.rejects(
        importDemoCatalog(prisma, upload, { apply: true }),
        /identity collision/,
      );
      assert.equal(await prisma.product.count(), 48);
    } finally {
      await prisma.$disconnect();
    }
  },
);

test('production target accepts regional direct Neon hosts but rejects poolers, wrong endpoints and missing confirmation', () => {
  const direct =
    'postgresql://ep-withered-shadow-b230htte.eu-central-1.aws.neon.tech/neondb?sslmode=require';
  assert.doesNotThrow(() => validateDemoTarget(direct, true));
  assert.throws(() => validateDemoTarget(direct, false));
  assert.throws(() =>
    validateDemoTarget(direct.replace('htte.', 'htte-pooler.'), true),
  );
  assert.throws(() =>
    validateDemoTarget(direct.replace('withered', 'other'), true),
  );
  assert.throws(() =>
    validateDemoTarget(direct.replace('require', 'disable'), true),
  );
  assert.throws(() =>
    validateDemoTarget(
      direct.replace('.neon.tech', '.neon.tech.example.com'),
      true,
    ),
  );
});

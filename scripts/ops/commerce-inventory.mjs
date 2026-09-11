import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { PrismaClient } = require(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../../packages/database/dist/index.js',
  ),
);

const databaseUrl = process.env.DATABASE_URL;
const apply = process.argv.includes('--apply');

if (!databaseUrl) {
  console.error('Set DATABASE_URL before running commerce inventory.');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

async function countBy(model, field) {
  const rows = await model.groupBy({
    by: [field],
    _count: { _all: true },
  });
  return Object.fromEntries(
    rows.map((row) => [String(row[field]), row._count._all]),
  );
}

async function main() {
  const [migrations, listingsByStatus, bids, ordersByStatus, activeListings] =
    await Promise.all([
      prisma.$queryRaw`
        SELECT migration_name, finished_at
        FROM "_prisma_migrations"
        ORDER BY finished_at ASC NULLS LAST, migration_name ASC
      `,
      countBy(prisma.listing, 'status'),
      prisma.bid.count(),
      countBy(prisma.order, 'status'),
      prisma.listing.findMany({
        where: { status: { in: ['SCHEDULED', 'LIVE'] } },
        select: { id: true, status: true, productId: true },
      }),
    ]);

  const inventory = {
    migrations: migrations.map((row) => row.migration_name),
    listingsByStatus,
    bids,
    ordersByStatus,
    activeListings: activeListings.length,
  };

  console.log(JSON.stringify(inventory, null, 2));

  if (!apply) {
    console.log(
      'Read-only inventory. Re-run with --apply to set SCHEDULED/LIVE listings to CANCELLED.',
    );
    return;
  }

  const closedAt = new Date();
  const updated = await prisma.listing.updateMany({
    where: { status: { in: ['SCHEDULED', 'LIVE'] } },
    data: { status: 'CANCELLED', closedAt },
  });
  console.log(
    JSON.stringify({
      applied: true,
      cancelled: updated.count,
      closedAt: closedAt.toISOString(),
    }),
  );
}

main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Commerce inventory failed',
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

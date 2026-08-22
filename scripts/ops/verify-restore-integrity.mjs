import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { PrismaClient } = require(
  join(dirname(fileURLToPath(import.meta.url)), '../../packages/database/dist/index.js'),
);

const targetDatabaseUrl = process.env.TARGET_DATABASE_URL;

if (!targetDatabaseUrl) {
  console.error('Set TARGET_DATABASE_URL before running restore integrity checks.');
  process.exit(1);
}

const sampleSize = Number(process.env.INTEGRITY_SAMPLE_SIZE ?? 5);
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: targetDatabaseUrl,
    },
  },
});

async function main() {
  const [users, listings, bids, orders, images] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.bid.count(),
    prisma.order.count(),
    prisma.productImage.count(),
  ]);

  console.log(
    JSON.stringify(
      {
        users,
        listings,
        bids,
        orders,
        productImages: images,
      },
      null,
      2,
    ),
  );

  if (images === 0) {
    console.log('No product images to checksum; count checks only.');
    return;
  }

  const samples = await prisma.productImage.findMany({
    take: sampleSize,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      checksum: true,
      data: true,
    },
  });

  for (const image of samples) {
    const computed = createHash('sha256').update(image.data).digest('hex');

    if (computed !== image.checksum) {
      console.error(`Checksum mismatch for image ${image.id}`);
      process.exit(1);
    }
  }

  console.log(`Verified ${samples.length} product image checksum(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

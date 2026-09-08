import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { PrismaClient } = require(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../../packages/database/dist/index.js',
  ),
);

const targetDatabaseUrl = process.env.TARGET_DATABASE_URL;
const requiredS3Keys = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
];

if (!targetDatabaseUrl || requiredS3Keys.some((key) => !process.env[key])) {
  console.error(
    'Set TARGET_DATABASE_URL and complete S3 configuration before running restore integrity checks.',
  );
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
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
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
      objectKey: true,
      checksum: true,
    },
  });

  for (const image of samples) {
    if (!image.objectKey) {
      console.error(`Missing object key for image ${image.id}`);
      process.exit(1);
    }
    const object = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: image.objectKey,
      }),
    );
    if (!object.Body) {
      console.error(`Missing object for image ${image.id}`);
      process.exit(1);
    }
    const computed = createHash('sha256')
      .update(await object.Body.transformToByteArray())
      .digest('hex');

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

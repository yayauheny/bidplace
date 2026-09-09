import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const requireFromApi = createRequire(
  join(scriptDirectory, '../../apps/api/package.json'),
);
const requireFromDatabase = createRequire(
  join(scriptDirectory, '../../packages/database/package.json'),
);
const { S3Client, PutObjectCommand } = requireFromApi('@aws-sdk/client-s3');
const { PrismaClient } = requireFromDatabase(
  join(scriptDirectory, '../../packages/database/dist/index.js'),
);

const dryRun = !process.argv.includes('--apply');
const databaseUrl = process.env.DATABASE_URL;
const requiredS3Keys = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
];

if (!databaseUrl || requiredS3Keys.some((key) => !process.env[key])) {
  console.error(
    'Set DATABASE_URL and complete S3 configuration before running media backfill.',
  );
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.S3_BUCKET;

function checksum(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function put(key, bytes, mimeType) {
  if (dryRun) return;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: mimeType,
    }),
  );
}

async function main() {
  const [products, sellers, steps] = await Promise.all([
    prisma.productImage.findMany({
      where: { data: { not: Buffer.alloc(0) } },
      select: {
        id: true,
        objectKey: true,
        data: true,
        mimeType: true,
        checksum: true,
      },
    }),
    prisma.sellerProfile.findMany({
      where: { profilePhotoData: { not: Buffer.alloc(0) } },
      select: {
        id: true,
        profilePhotoObjectKey: true,
        profilePhotoData: true,
        profilePhotoMimeType: true,
        profilePhotoChecksum: true,
      },
    }),
    prisma.productCreationStep.findMany({
      where: { data: { not: null } },
      select: {
        id: true,
        objectKey: true,
        data: true,
        mimeType: true,
        checksum: true,
      },
    }),
  ]);

  let uploaded = 0;
  for (const image of products) {
    if (!image.data || checksum(image.data) !== image.checksum)
      throw new Error(`Checksum mismatch for product image ${image.id}`);
    await put(
      image.objectKey ?? `product-image:${image.id}`,
      image.data,
      image.mimeType,
    );
    uploaded += 1;
  }
  for (const seller of sellers) {
    if (checksum(seller.profilePhotoData) !== seller.profilePhotoChecksum)
      throw new Error(`Checksum mismatch for seller photo ${seller.id}`);
    await put(
      seller.profilePhotoObjectKey ?? `seller-photo:${seller.id}`,
      seller.profilePhotoData,
      seller.profilePhotoMimeType,
    );
    uploaded += 1;
  }
  for (const step of steps) {
    if (!step.data || !step.mimeType || !step.checksum) continue;
    if (checksum(step.data) !== step.checksum)
      throw new Error(`Checksum mismatch for creation step ${step.id}`);
    await put(
      step.objectKey ?? `creation-step:${step.id}`,
      step.data,
      step.mimeType,
    );
    uploaded += 1;
  }

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? 'dry-run' : 'apply',
        productImages: products.length,
        sellerPhotos: sellers.length,
        creationStepImages: steps.length,
        uploaded,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Media backfill failed',
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

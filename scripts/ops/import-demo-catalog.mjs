import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { importDemoCatalog, validateDemoTarget } from './lib/demo-catalog.mjs';

const root = resolve(import.meta.dirname, '../..');
const requireDatabase = createRequire(
  resolve(root, 'packages/database/package.json'),
);
const requireApi = createRequire(resolve(root, 'apps/api/package.json'));
const { PrismaClient } = requireDatabase('./dist/index.js');
const { S3Client, GetObjectCommand, PutObjectCommand } =
  requireApi('@aws-sdk/client-s3');
const apply = process.argv.includes('--apply');
let prisma;
try {
  validateDemoTarget(
    process.env.DATABASE_URL,
    process.argv.includes('--confirm-production'),
  );
  prisma = new PrismaClient();
  if (
    apply &&
    [
      'S3_ENDPOINT',
      'S3_REGION',
      'S3_BUCKET',
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
    ].some((name) => !process.env[name])
  )
    throw new Error('Missing S3 configuration');
  const client = apply
    ? new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
      })
    : null;
  const upload = async (key, image) => {
    const params = { Bucket: process.env.S3_BUCKET, Key: key };
    let response;
    try {
      response = await client.send(new GetObjectCommand(params));
    } catch (error) {
      if (error?.$metadata?.httpStatusCode !== 404) throw error;
    }
    if (!response) {
      await client.send(
        new PutObjectCommand({
          ...params,
          Body: image.data,
          ContentType: image.mimeType,
          IfNoneMatch: '*',
        }),
      );
      response = await client.send(new GetObjectCommand(params));
    }
    const bytes = await response.Body.transformToByteArray();
    if (
      bytes.length !== image.byteLength ||
      createHash('sha256').update(bytes).digest('hex') !== image.checksum
    )
      throw new Error('Demo object checksum mismatch');
  };
  console.log(
    JSON.stringify(await importDemoCatalog(prisma, upload, { apply })),
  );
} catch {
  console.error(
    'Demo import failed; database target, configuration, identity collision or media verification requires operator review. Connection details are not logged.',
  );
  process.exitCode = 1;
} finally {
  await prisma?.$disconnect();
}

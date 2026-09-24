import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const requireFromApi = createRequire(
  join(scriptDirectory, '../../apps/api/package.json'),
);
const { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } =
  requireFromApi('@aws-sdk/client-s3');

const required = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required S3 configuration: ${missing.join(', ')}`);
  process.exit(1);
}

const prefix = process.env.MEDIA_PREFLIGHT_PREFIX ?? 'ops/preflight';
if (!/^[-a-zA-Z0-9/_]+$/.test(prefix) || prefix.startsWith('/')) {
  console.error('MEDIA_PREFLIGHT_PREFIX must be a relative S3 key prefix.');
  process.exit(1);
}

const bytes = Buffer.from(`bidplace-media-preflight:${randomUUID()}`);
const key = `${prefix.replace(/\/$/, '')}/${randomUUID()}`;
const checksum = createHash('sha256').update(bytes).digest('hex');
const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

try {
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: bytes,
    }),
  );
  const response = await client.send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
  );
  assert(response.Body, 'S3 preflight read returned no object body');
  const readChecksum = createHash('sha256')
    .update(await response.Body.transformToByteArray())
    .digest('hex');
  assert.equal(readChecksum, checksum, 'S3 preflight checksum mismatch');
  await client.send(
    new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
  );
  console.log(
    JSON.stringify({ status: 'ok', provider: 's3', prefix }, null, 2),
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? `Media preflight failed: ${error.message}`
      : 'Media preflight failed',
  );
  process.exitCode = 1;
}

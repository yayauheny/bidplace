import { createHash } from 'node:crypto';

const imageFields = {
  bytes: 'data',
  mime: 'mimeType',
  length: 'byteLength',
  checksum: 'checksum',
  key: 'objectKey',
};
const photoFields = {
  bytes: 'profilePhotoData',
  mime: 'profilePhotoMimeType',
  length: 'profilePhotoByteLength',
  checksum: 'profilePhotoChecksum',
  key: 'profilePhotoObjectKey',
};
const mediaSources = [
  {
    model: 'productImage',
    count: 'productImages',
    prefix: 'product-image',
    fields: imageFields,
  },
  {
    model: 'sellerProfile',
    count: 'sellerPhotos',
    prefix: 'seller-photo',
    fields: photoFields,
  },
  {
    model: 'productCreationStep',
    count: 'creationStepImages',
    prefix: 'creation-step',
    fields: imageFields,
  },
  {
    model: 'sellerProfileRevision',
    count: 'sellerRevisionPhotos',
    prefix: 'seller-profile-revision',
    fields: photoFields,
  },
  {
    model: 'sellerProfileRevisionAchievement',
    count: 'achievementImages',
    prefix: 'seller-achievement',
    fields: imageFields,
  },
];

function checksum(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function assetFromRow(source, row) {
  const fields = source.fields;
  const bytes = row[fields.bytes];
  const mimeType = row[fields.mime];
  const byteLength = row[fields.length];
  const expectedChecksum = row[fields.checksum];
  const storedKey = row[fields.key];
  const hasBytes = Boolean(bytes?.byteLength);
  if (!hasBytes && !mimeType && !byteLength && !expectedChecksum && !storedKey)
    return null;
  if (
    typeof mimeType !== 'string' ||
    !mimeType ||
    !Number.isSafeInteger(byteLength) ||
    byteLength <= 0 ||
    typeof expectedChecksum !== 'string' ||
    !/^[a-f0-9]{64}$/.test(expectedChecksum) ||
    (storedKey != null && (typeof storedKey !== 'string' || !storedKey))
  ) {
    throw new Error(`Incomplete media metadata: ${source.model}/${row.id}`);
  }
  if (
    hasBytes &&
    (bytes.byteLength !== byteLength || checksum(bytes) !== expectedChecksum)
  ) {
    throw new Error(
      `Source checksum/length mismatch: ${source.model}/${row.id}`,
    );
  }
  return {
    id: row.id,
    key: storedKey ?? `${source.prefix}:${row.id}`,
    storedKey,
    bytes: hasBytes ? bytes : null,
    mimeType,
    byteLength,
    checksum: expectedChecksum,
  };
}

async function scan(prisma, visit) {
  for (const source of mediaSources) {
    let lastId;
    while (true) {
      const rows = await prisma[source.model].findMany({
        where: lastId ? { id: { gt: lastId } } : {},
        orderBy: { id: 'asc' },
        take: 10,
        select: Object.fromEntries(
          ['id', ...Object.values(source.fields)].map((field) => [field, true]),
        ),
      });
      if (rows.length === 0) break;
      for (const row of rows) {
        const asset = assetFromRow(source, row);
        if (asset) await visit(source, asset);
      }
      lastId = rows.at(-1).id;
    }
  }
}

function signature(asset) {
  return `${asset.checksum}:${asset.byteLength}:${asset.mimeType}`;
}

async function readTarget(client, commands, bucket, key) {
  try {
    return await client.send(
      new commands.GetObjectCommand({ Bucket: bucket, Key: key }),
    );
  } catch (error) {
    if (error?.name === 'NoSuchKey' || error?.name === 'NotFound') return null;
    throw error;
  }
}

async function verifyTarget(response, asset) {
  if (!response?.Body) throw new Error(`Target object is missing: ${asset.id}`);
  const bytes = await response.Body.transformToByteArray();
  if (
    bytes.byteLength !== asset.byteLength ||
    checksum(bytes) !== asset.checksum ||
    response.ContentType !== asset.mimeType
  ) {
    throw new Error(`Target checksum/length/type mismatch: ${asset.id}`);
  }
}

export async function runMediaBackfill({
  prisma,
  client,
  commands,
  bucket,
  dryRun,
}) {
  const report = {
    mode: dryRun ? 'dry-run' : 'apply',
    ...Object.fromEntries(mediaSources.map((source) => [source.count, 0])),
    rowsWithSourceBytes: 0,
    rowsRequiringExistingObject: 0,
    uniqueObjects: 0,
    uploaded: 0,
    verified: 0,
    alreadyPresent: 0,
    referencesUpdated: 0,
  };
  const planned = new Map();
  await scan(prisma, async (source, asset) => {
    const expected = planned.get(asset.key);
    if (expected && expected !== signature(asset)) {
      throw new Error(
        `Conflicting media rows share an object key: ${asset.id}`,
      );
    }
    planned.set(asset.key, signature(asset));
    report[source.count] += 1;
    report[
      asset.bytes ? 'rowsWithSourceBytes' : 'rowsRequiringExistingObject'
    ] += 1;
  });
  report.uniqueObjects = planned.size;
  if (dryRun) return report;

  const verified = new Set();
  function assertUnchanged(asset) {
    if (planned.get(asset.key) !== signature(asset)) {
      throw new Error(`Media changed after inventory: ${asset.id}`);
    }
  }
  await scan(prisma, async (_source, asset) => {
    assertUnchanged(asset);
    if (!asset.bytes || verified.has(asset.key)) return;
    let response = await readTarget(client, commands, bucket, asset.key);
    if (response) {
      report.alreadyPresent += 1;
    } else {
      await client.send(
        new commands.PutObjectCommand({
          Bucket: bucket,
          Key: asset.key,
          Body: asset.bytes,
          ContentType: asset.mimeType,
        }),
      );
      report.uploaded += 1;
      response = await readTarget(client, commands, bucket, asset.key);
    }
    await verifyTarget(response, asset);
    verified.add(asset.key);
  });
  await scan(prisma, async (source, asset) => {
    assertUnchanged(asset);
    if (!verified.has(asset.key)) {
      await verifyTarget(
        await readTarget(client, commands, bucket, asset.key),
        asset,
      );
      verified.add(asset.key);
      report.alreadyPresent += 1;
    }
    if (asset.storedKey == null) {
      const result = await prisma[source.model].updateMany({
        where: {
          id: asset.id,
          [source.fields.key]: null,
          [source.fields.checksum]: asset.checksum,
          [source.fields.length]: asset.byteLength,
          [source.fields.mime]: asset.mimeType,
        },
        data: { [source.fields.key]: asset.key },
      });
      if (result.count !== 1)
        throw new Error(`Media changed before reference update: ${asset.id}`);
      report.referencesUpdated += 1;
    }
  });
  if (verified.size !== planned.size)
    throw new Error('Media inventory changed during backfill');
  report.verified = verified.size;
  return report;
}

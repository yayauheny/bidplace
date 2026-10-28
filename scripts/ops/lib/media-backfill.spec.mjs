import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import { runMediaBackfill } from './media-backfill.mjs';

class PutObjectCommand {
  constructor(input) {
    this.input = input;
  }
}
class GetObjectCommand {
  constructor(input) {
    this.input = input;
  }
}
const commands = { PutObjectCommand, GetObjectCommand };
const bytes = Buffer.from('legacy image bytes');
const checksum = createHash('sha256').update(bytes).digest('hex');

function image(id, key = null) {
  return {
    id,
    data: bytes,
    mimeType: 'image/png',
    byteLength: bytes.length,
    checksum,
    objectKey: key,
  };
}
function photo(id, key = null) {
  return {
    id,
    profilePhotoData: bytes,
    profilePhotoMimeType: 'image/png',
    profilePhotoByteLength: bytes.length,
    profilePhotoChecksum: checksum,
    profilePhotoObjectKey: key,
  };
}
function rowsForAllMedia() {
  return {
    productImage: [image('product')],
    sellerProfile: [photo('seller')],
    productCreationStep: [image('step')],
    sellerProfileRevision: [photo('revision')],
    sellerProfileRevisionAchievement: [image('achievement')],
  };
}
function database(rows) {
  const updates = [];
  const reads = [];
  const prisma = Object.fromEntries(
    Object.entries(rows).map(([model, records]) => [
      model,
      {
        async findMany(query) {
          reads.push({ model, take: query.take });
          return records
            .filter((row) => !query.where.id || row.id > query.where.id.gt)
            .sort((left, right) => left.id.localeCompare(right.id))
            .slice(0, query.take);
        },
        async updateMany({ where, data }) {
          const row = records.find((candidate) =>
            Object.entries(where).every(
              ([field, value]) => candidate[field] === value,
            ),
          );
          if (!row) return { count: 0 };
          updates.push({ model, id: row.id, data });
          Object.assign(row, data);
          return { count: 1 };
        },
      },
    ]),
  );
  return { prisma, updates, reads };
}
function storage(objects = new Map()) {
  const calls = [];
  const client = {
    async send(command) {
      calls.push(command);
      const input = command.input;
      if (command instanceof PutObjectCommand) {
        objects.set(input.Key, {
          bytes: Buffer.from(input.Body),
          mimeType: input.ContentType,
        });
        return {};
      }
      const object = objects.get(input.Key);
      if (!object)
        throw Object.assign(new Error('missing object'), { name: 'NoSuchKey' });
      return {
        Body: { transformToByteArray: async () => object.bytes },
        ContentType: object.mimeType,
      };
    },
  };
  return { client, calls, objects };
}
function run(db, target, dryRun = false) {
  return runMediaBackfill({
    prisma: db.prisma,
    client: target.client,
    commands,
    bucket: 'private-r2-test',
    dryRun,
  });
}

test('dry-run inventories all five media owners without storage or database writes', async () => {
  const rows = rowsForAllMedia();
  rows.sellerProfileRevisionAchievement.push({ id: 'text-only' });
  const db = database(rows);
  const target = storage();
  const report = await run(db, target, true);
  for (const field of [
    'productImages',
    'sellerPhotos',
    'creationStepImages',
    'sellerRevisionPhotos',
    'achievementImages',
  ]) {
    assert.equal(report[field], 1);
  }
  assert.equal(report.uniqueObjects, 5);
  assert.equal(report.uploaded, 0);
  assert.equal(report.verified, 0);
  assert.equal(db.updates.length, 0);
  assert.equal(target.calls.length, 0);
});

test('apply verifies every media owner, persists missing keys and keeps original bytes on repeated runs', async () => {
  const rows = rowsForAllMedia();
  const db = database(rows);
  const target = storage();
  const first = await run(db, target);
  assert.equal(first.uploaded, 5);
  assert.equal(first.verified, 5);
  assert.equal(first.referencesUpdated, 5);
  assert.deepEqual([...target.objects.keys()].sort(), [
    'creation-step:step',
    'product-image:product',
    'seller-achievement:achievement',
    'seller-photo:seller',
    'seller-profile-revision:revision',
  ]);
  for (const records of Object.values(rows)) {
    const row = records[0];
    assert.deepEqual(row.data ?? row.profilePhotoData, bytes);
  }
  const second = await run(db, target);
  assert.equal(second.uploaded, 0);
  assert.equal(second.verified, 5);
  assert.equal(second.alreadyPresent, 5);
  assert.equal(second.referencesUpdated, 0);
});

test('a parent photo reference can use bytes held by its later revision without duplicating the object', async () => {
  const rows = rowsForAllMedia();
  rows.sellerProfile[0].profilePhotoObjectKey =
    'seller-profile-revision:revision';
  rows.sellerProfile[0].profilePhotoData = Buffer.alloc(0);
  const db = database(rows);
  const target = storage();
  const report = await run(db, target);
  assert.equal(report.rowsRequiringExistingObject, 1);
  assert.equal(report.uploaded, 4);
  assert.equal(report.verified, 4);
});

test('invalid source bytes in a revision achievement fail before any target write', async () => {
  const rows = rowsForAllMedia();
  rows.sellerProfileRevisionAchievement[0].data = Buffer.from('bad');
  const db = database(rows);
  const target = storage();
  await assert.rejects(run(db, target), /Source checksum\/length mismatch/);
  assert.equal(target.calls.length, 0);
  assert.equal(db.updates.length, 0);
});

test('a different object already using the target key is never overwritten', async () => {
  const db = database(rowsForAllMedia());
  const target = storage(
    new Map([
      [
        'product-image:product',
        {
          bytes: Buffer.from('unrelated object'),
          mimeType: 'image/png',
        },
      ],
    ]),
  );
  await assert.rejects(
    run(db, target),
    /Target checksum\/length\/type mismatch/,
  );
  assert.equal(
    target.calls.filter((call) => call instanceof PutObjectCommand).length,
    0,
  );
  assert.equal(db.updates.length, 0);
});

test('a failed read after upload leaves the original bytes and database keys intact', async () => {
  const rows = rowsForAllMedia();
  const db = database(rows);
  let put = false;
  const target = {
    client: {
      async send(command) {
        if (command instanceof PutObjectCommand) {
          put = true;
          return {};
        }
        if (!put)
          throw Object.assign(new Error('missing'), { name: 'NoSuchKey' });
        throw new Error('read unavailable');
      },
    },
  };
  await assert.rejects(run(db, target), /read unavailable/);
  assert.equal(db.updates.length, 0);
  assert.equal(rows.productImage[0].objectKey, null);
  assert.deepEqual(rows.productImage[0].data, bytes);
});

test('conflicting metadata for a shared object key fails before writes', async () => {
  const rows = rowsForAllMedia();
  rows.sellerProfile[0].profilePhotoObjectKey = 'product-image:product';
  rows.sellerProfile[0].profilePhotoMimeType = 'image/jpeg';
  const db = database(rows);
  const target = storage();
  await assert.rejects(run(db, target), /Conflicting media rows/);
  assert.equal(target.calls.length, 0);
  assert.equal(db.updates.length, 0);
});

test('a metadata-only reference fails when neither source bytes nor a target object exist', async () => {
  const rows = rowsForAllMedia();
  for (const records of Object.values(rows)) records.length = 0;
  rows.sellerProfileRevision.push({
    ...photo('missing', 'existing-photo'),
    profilePhotoData: null,
  });
  const db = database(rows);
  const target = storage();
  await assert.rejects(run(db, target), /Target object is missing/);
  assert.equal(
    target.calls.filter((call) => call instanceof PutObjectCommand).length,
    0,
  );
  assert.equal(db.updates.length, 0);
});

test('all media beyond the first database batch are copied and verified', async () => {
  const rows = rowsForAllMedia();
  rows.productImage = Array.from({ length: 23 }, (_, index) =>
    image(`product-${String(index).padStart(2, '0')}`),
  );
  const db = database(rows);
  const target = storage();
  const report = await run(db, target);
  assert.equal(report.productImages, 23);
  assert.equal(report.uploaded, 27);
  assert.equal(report.verified, 27);
  assert.ok(db.reads.every((read) => read.take <= 10));
});

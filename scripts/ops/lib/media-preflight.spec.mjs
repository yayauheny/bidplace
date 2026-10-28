import assert from 'node:assert/strict';
import test from 'node:test';

import { runMediaPreflight } from './media-preflight.mjs';

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
class DeleteObjectCommand {
  constructor(input) {
    this.input = input;
  }
}

const commands = { PutObjectCommand, GetObjectCommand, DeleteObjectCommand };
const bytes = Buffer.from('preflight bytes');

function clientWith(send) {
  return { send };
}

test('media preflight deletes its exact object after successful verification', async () => {
  const calls = [];
  await runMediaPreflight({
    client: clientWith(async (command) => {
      calls.push(command);
      if (command instanceof GetObjectCommand) {
        return { Body: { transformToByteArray: async () => bytes } };
      }
      return {};
    }),
    commands,
    bucket: 'bucket',
    key: 'ops/preflight/object',
    bytes,
  });
  assert.deepEqual(
    calls.map((command) => command.constructor),
    [PutObjectCommand, GetObjectCommand, DeleteObjectCommand],
  );
  assert.deepEqual(calls[2].input, {
    Bucket: 'bucket',
    Key: 'ops/preflight/object',
  });
});

test('media preflight deletes its exact object when the read fails', async () => {
  const calls = [];
  await assert.rejects(
    runMediaPreflight({
      client: clientWith(async (command) => {
        calls.push(command);
        if (command instanceof GetObjectCommand) throw new Error('read failed');
        return {};
      }),
      commands,
      bucket: 'bucket',
      key: 'ops/preflight/object',
      bytes,
    }),
    /read failed/,
  );
  assert.equal(calls.at(-1).constructor, DeleteObjectCommand);
});

test('media preflight deletes its exact object when the checksum mismatches', async () => {
  const calls = [];
  await assert.rejects(
    runMediaPreflight({
      client: clientWith(async (command) => {
        calls.push(command);
        if (command instanceof GetObjectCommand) {
          return {
            Body: { transformToByteArray: async () => Buffer.from('wrong') },
          };
        }
        return {};
      }),
      commands,
      bucket: 'bucket',
      key: 'ops/preflight/object',
      bytes,
    }),
    /checksum mismatch/,
  );
  assert.equal(calls.at(-1).constructor, DeleteObjectCommand);
});

test('media preflight does not delete when the write fails', async () => {
  const calls = [];
  await assert.rejects(
    runMediaPreflight({
      client: clientWith(async (command) => {
        calls.push(command);
        throw new Error('write failed');
      }),
      commands,
      bucket: 'bucket',
      key: 'ops/preflight/object',
      bytes,
    }),
    /write failed/,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].constructor, PutObjectCommand);
});

test('media preflight preserves the verification failure when cleanup also fails', async () => {
  const reports = [];
  await assert.rejects(
    runMediaPreflight({
      client: clientWith(async (command) => {
        if (command instanceof GetObjectCommand) throw new Error('read failed');
        if (command instanceof DeleteObjectCommand)
          throw new Error('delete failed');
        return {};
      }),
      commands,
      bucket: 'bucket',
      key: 'ops/preflight/object',
      bytes,
      reportCleanupError: (error) => reports.push(error.message),
    }),
    /read failed/,
  );
  assert.deepEqual(reports, ['delete failed']);
});

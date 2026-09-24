import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export async function runMediaPreflight({
  client,
  commands,
  bucket,
  key,
  bytes,
  reportCleanupError = (error) =>
    console.error(`Media preflight cleanup failed: ${error.message}`),
}) {
  const checksum = createHash('sha256').update(bytes).digest('hex');
  let putSucceeded = false;
  let verificationError;

  try {
    await client.send(
      new commands.PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes }),
    );
    putSucceeded = true;
    const response = await client.send(
      new commands.GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    assert(response.Body, 'S3 preflight read returned no object body');
    const readChecksum = createHash('sha256')
      .update(await response.Body.transformToByteArray())
      .digest('hex');
    assert.equal(readChecksum, checksum, 'S3 preflight checksum mismatch');
  } catch (error) {
    verificationError = error;
    throw error;
  } finally {
    if (putSucceeded) {
      try {
        await client.send(
          new commands.DeleteObjectCommand({ Bucket: bucket, Key: key }),
        );
      } catch (cleanupError) {
        reportCleanupError(cleanupError);
        if (!verificationError) throw cleanupError;
      }
    }
  }
}

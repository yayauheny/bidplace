import { ServiceUnavailableException } from '@nestjs/common';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { buildMediaPipeline } from '../core/media/media-pipeline';
import { validateAndNormalizeProductImageUploads } from './image-policy';
import { withImageProcessingAdmission } from './image-processing-admission';

async function png() {
  return sharp({
    create: { width: 8, height: 8, channels: 3, background: 'red' },
  })
    .png()
    .toBuffer();
}

async function holdAdmission() {
  let release!: () => void;
  let entered!: () => void;
  const enteredPromise = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const task = withImageProcessingAdmission(async () => {
    entered();
    await gate;
  });
  await enteredPromise;
  return { release: () => release(), task };
}

describe('image processing admission', () => {
  it('releases a slot after failure so later work can enter', async () => {
    await expect(
      validateAndNormalizeProductImageUploads([
        { buffer: Buffer.from('broken image'), mimetype: 'image/jpeg' },
      ]),
    ).rejects.toThrow('Unsupported image type');
    await expect(
      buildMediaPipeline(
        { buffer: Buffer.from('broken image'), mimetype: 'image/jpeg' },
        'WORK_IMAGE',
      ),
    ).rejects.toThrow('Unsupported image type');

    const held = [await holdAdmission(), await holdAdmission()];
    await expect(
      withImageProcessingAdmission(async () => 'busy'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    held.forEach((admission) => admission.release());
    await Promise.all(held.map((admission) => admission.task));

    const source = await png();
    const result = await buildMediaPipeline(
      { buffer: source, mimetype: 'image/png' },
      'ACHIEVEMENT',
    );
    expect(result.map((item) => item.variant)).toEqual(['SOURCE', 'PREVIEW']);
    expect(result[0]?.bytes).toEqual(source);
  });

  it('shares one admission across author, achievement, and work processing', async () => {
    const source = await png();
    const held = [await holdAdmission(), await holdAdmission()];
    await expect(
      validateAndNormalizeProductImageUploads([
        { buffer: source, mimetype: 'image/png' },
      ]),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(
      buildMediaPipeline(
        { buffer: source, mimetype: 'image/png' },
        'AUTHOR_PHOTO',
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    held.forEach((admission) => admission.release());
    await Promise.all(held.map((admission) => admission.task));
  });

  it('does not consume a second slot for nested pipeline validation', async () => {
    const source = await png();
    let releaseOuter!: () => void;
    let pipelineDone!: () => void;
    const pipelineDonePromise = new Promise<void>((resolve) => {
      pipelineDone = resolve;
    });
    const outerGate = new Promise<void>((resolve) => {
      releaseOuter = resolve;
    });
    const outer = withImageProcessingAdmission(async () => {
      await buildMediaPipeline(
        { buffer: source, mimetype: 'image/png' },
        'AUTHOR_PHOTO',
      );
      pipelineDone();
      await outerGate;
    });
    await pipelineDonePromise;
    const sibling = await holdAdmission();
    await expect(
      withImageProcessingAdmission(async () => 'overflow'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    sibling.release();
    await sibling.task;
    releaseOuter();
    await outer;
  });
});

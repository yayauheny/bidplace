import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

import { loadServerEnv } from '../core/config';

const serverEnv = loadServerEnv();

export const supportedImageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type SupportedImageMimeType = (typeof supportedImageMimeTypes)[number];

export type RawImageUpload = {
  buffer: Buffer;
  mimetype?: string;
};

export type ValidatedImageUpload = {
  buffer: Buffer;
  mimeType: SupportedImageMimeType;
};

export const lotImageUploadLimits = {
  maxFiles: serverEnv.LOT_IMAGE_MAX_FILES,
  maxFileBytes: serverEnv.LOT_IMAGE_MAX_FILE_BYTES,
  maxTotalBytes: serverEnv.LOT_IMAGE_MAX_TOTAL_BYTES,
} as const;

const supportedImageMimeTypeSet = new Set<string>(supportedImageMimeTypes);

function isPng(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

function isJpeg(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isGif(buffer: Buffer): boolean {
  return (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).equals(Buffer.from('GIF87a')) ||
      buffer.subarray(0, 6).equals(Buffer.from('GIF89a')))
  );
}

function isWebp(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(Buffer.from('RIFF')) &&
    buffer.subarray(8, 12).equals(Buffer.from('WEBP'))
  );
}

export function detectImageMimeType(
  buffer: Buffer,
): SupportedImageMimeType | null {
  if (isJpeg(buffer)) {
    return 'image/jpeg';
  }

  if (isPng(buffer)) {
    return 'image/png';
  }

  if (isWebp(buffer)) {
    return 'image/webp';
  }

  if (isGif(buffer)) {
    return 'image/gif';
  }

  return null;
}

async function assertDecodableRasterImage(
  buffer: Buffer,
  mimeType: SupportedImageMimeType,
): Promise<void> {
  try {
    await sharp(buffer, {
      animated: true,
      failOn: 'error',
    })
      .raw()
      .toBuffer();
  } catch {
    throw new BadRequestException(
      `${mimeType} payload is corrupted or not decodable`,
    );
  }
}

export async function validateLotImageUploads(
  files: readonly RawImageUpload[],
): Promise<ValidatedImageUpload[]> {
  if (files.length > lotImageUploadLimits.maxFiles) {
    throw new BadRequestException(
      `A lot can have at most ${lotImageUploadLimits.maxFiles} images`,
    );
  }

  let totalBytes = 0;

  const validatedFiles = await Promise.all(files.map(async (file) => {
    if (file.mimetype && !supportedImageMimeTypeSet.has(file.mimetype)) {
      throw new BadRequestException('Unsupported image type');
    }

    if (file.buffer.length === 0) {
      throw new BadRequestException('Image file is empty');
    }

    if (file.buffer.length > lotImageUploadLimits.maxFileBytes) {
      throw new BadRequestException('Image file is too large');
    }

    totalBytes += file.buffer.length;

    const detectedMimeType = detectImageMimeType(file.buffer);

    if (!detectedMimeType) {
      throw new BadRequestException('Unsupported or invalid image file');
    }

    if (file.mimetype && file.mimetype !== detectedMimeType) {
      throw new BadRequestException('Image MIME type does not match file contents');
    }

    await assertDecodableRasterImage(file.buffer, detectedMimeType);

    return {
      buffer: file.buffer,
      mimeType: detectedMimeType,
    };
  }));

  if (totalBytes > lotImageUploadLimits.maxTotalBytes) {
    throw new BadRequestException(
      `A lot cannot exceed ${lotImageUploadLimits.maxTotalBytes} total image bytes`,
    );
  }

  return validatedFiles;
}

export function getImageCacheControl(isPublic: boolean): string {
  return isPublic
    ? 'public, max-age=31536000, immutable'
    : 'private, max-age=60';
}

import { BadRequestException } from '@nestjs/common';
import sharp, { type Metadata } from 'sharp';

export const productImageUploadLimits = {
  maxFiles: 10,
  maxFileBytes: 5 * 1024 * 1024,
  maxTotalBytes: 20 * 1024 * 1024,
} as const;

export const productImagePixelBudgets = {
  maxEdgePx: 4096,
  maxPixels: 16_777_216,
} as const;

const supportedImageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export { supportedImageMimeTypes };

export function acceptSupportedUploadMimeType(
  mimetype: string,
  done: (error: Error | null, accept: boolean) => void,
): void {
  if (supportedImageMimeTypes.includes(mimetype as never)) {
    done(null, true);
    return;
  }

  done(new BadRequestException('Unsupported image type'), false);
}

export type SupportedImageMimeType = (typeof supportedImageMimeTypes)[number];

export type RawImageUpload = {
  buffer: Buffer;
  mimetype: string;
};

export type ValidatedImageUpload = {
  source?: RawImageUpload;
  buffer: Buffer;
  mimeType: SupportedImageMimeType;
  width?: number;
  height?: number;
};

export function assertProductImageCapacity(
  existingImages: readonly { byteLength: number }[],
  incomingFiles: readonly { byteLength: number }[],
): void {
  const totalCount = existingImages.length + incomingFiles.length;
  if (totalCount > productImageUploadLimits.maxFiles) {
    throw new BadRequestException(
      `A Product can have at most ${productImageUploadLimits.maxFiles} images`,
    );
  }

  const totalBytes =
    existingImages.reduce((sum, image) => sum + image.byteLength, 0) +
    incomingFiles.reduce((sum, file) => sum + file.byteLength, 0);

  if (totalBytes > productImageUploadLimits.maxTotalBytes) {
    throw new BadRequestException(
      `A Product cannot exceed ${productImageUploadLimits.maxTotalBytes} total image bytes`,
    );
  }
}

export function detectImageMimeType(
  buffer: Buffer,
): SupportedImageMimeType | null {
  if (buffer.length < 12) {
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

function assertSupportedMimeType(
  mimetype: string,
): asserts mimetype is SupportedImageMimeType {
  if (!supportedImageMimeTypes.includes(mimetype as SupportedImageMimeType)) {
    throw new BadRequestException('Unsupported image type');
  }
}

function assertStaticImageMetadata(
  mimeType: SupportedImageMimeType,
  metadata: Metadata,
): void {
  const frameCount = metadata.pages ?? 1;
  if (frameCount > 1) {
    throw new BadRequestException('Animated images are not supported');
  }

  if (Array.isArray(metadata.delay) && metadata.delay.length > 1) {
    throw new BadRequestException('Animated images are not supported');
  }

  const width = metadata.width;
  const height = metadata.height;
  if (!width || !height) {
    throw new BadRequestException(
      `${mimeType} payload is corrupted or not decodable`,
    );
  }

  if (
    width > productImagePixelBudgets.maxEdgePx ||
    height > productImagePixelBudgets.maxEdgePx
  ) {
    throw new BadRequestException(
      `Image dimensions cannot exceed ${productImagePixelBudgets.maxEdgePx}px on either edge`,
    );
  }

  if (width * height > productImagePixelBudgets.maxPixels) {
    throw new BadRequestException(
      `Image cannot exceed ${productImagePixelBudgets.maxPixels} pixels`,
    );
  }
}

async function normalizeStaticImage(
  buffer: Buffer,
  mimeType: SupportedImageMimeType,
): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: SupportedImageMimeType;
}> {
  const outputMimeType: SupportedImageMimeType =
    mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  const outputFormat = outputMimeType === 'image/png' ? 'png' : 'jpeg';

  try {
    const normalized = await sharp(buffer, {
      limitInputPixels: productImagePixelBudgets.maxPixels,
      animated: false,
    })
      .rotate()
      .toFormat(outputFormat)
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: normalized.data,
      width: normalized.info.width,
      height: normalized.info.height,
      mimeType: outputMimeType,
    };
  } catch {
    throw new BadRequestException(
      `${mimeType} payload is corrupted or not decodable`,
    );
  }
}

export async function validateAndNormalizeProductImageUploads(
  files: readonly RawImageUpload[],
): Promise<ValidatedImageUpload[]> {
  const validated: ValidatedImageUpload[] = [];

  for (const file of files) {
    if (!file.buffer?.length) {
      throw new BadRequestException('Image file is empty');
    }

    if (file.buffer.byteLength > productImageUploadLimits.maxFileBytes) {
      throw new BadRequestException(
        `Each image must be at most ${productImageUploadLimits.maxFileBytes} bytes`,
      );
    }

    assertSupportedMimeType(file.mimetype);

    const detectedMimeType = detectImageMimeType(file.buffer);
    if (!detectedMimeType) {
      throw new BadRequestException('Unsupported image type');
    }

    if (detectedMimeType !== file.mimetype) {
      throw new BadRequestException(
        'Image MIME type does not match file contents',
      );
    }

    let metadata: Metadata;
    try {
      metadata = await sharp(file.buffer, {
        limitInputPixels: productImagePixelBudgets.maxPixels,
        animated: true,
      }).metadata();
    } catch {
      throw new BadRequestException(
        `${detectedMimeType} payload is corrupted or not decodable`,
      );
    }

    assertStaticImageMetadata(detectedMimeType, metadata);

    const normalized = await normalizeStaticImage(
      file.buffer,
      detectedMimeType,
    );

    validated.push({
      source: file,
      buffer: normalized.buffer,
      mimeType: normalized.mimeType,
      width: normalized.width,
      height: normalized.height,
    });
  }

  return validated;
}

/** @deprecated Prefer validateAndNormalizeProductImageUploads */
export const validateProductImageUploads =
  validateAndNormalizeProductImageUploads;

export const PRIVATE_IMAGE_CACHE_CONTROL = 'private, no-store';
export const IMMUTABLE_PUBLIC_IMAGE_CACHE_CONTROL =
  'public, max-age=31536000, immutable';
export const MUTABLE_PUBLIC_IMAGE_CACHE_CONTROL =
  'public, max-age=0, must-revalidate';

export type ImageCacheKind = 'product' | 'creation-step' | 'seller-photo';

export function getImageCacheControl(input: {
  isPublic: boolean;
  kind: ImageCacheKind;
}): string {
  if (!input.isPublic) {
    return PRIVATE_IMAGE_CACHE_CONTROL;
  }
  if (input.kind === 'product') {
    return IMMUTABLE_PUBLIC_IMAGE_CACHE_CONTROL;
  }
  return MUTABLE_PUBLIC_IMAGE_CACHE_CONTROL;
}

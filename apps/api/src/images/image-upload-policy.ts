import { BadRequestException } from '@nestjs/common';

export const productImageUploadLimits = {
  maxFiles: 10,
  maxFileBytes: 5 * 1024 * 1024,
  maxTotalBytes: 20 * 1024 * 1024,
} as const;

export { workImageMaxInputBytes } from '@bidplace/contracts';

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

export function assertProductImageCount(
  existingCount: number,
  incomingCount: number,
): void {
  if (existingCount + incomingCount > productImageUploadLimits.maxFiles) {
    throw new BadRequestException(
      `A Product can have at most ${productImageUploadLimits.maxFiles} images`,
    );
  }
}

export function assertProductImageCapacity(
  existingImages: readonly { byteLength: number }[],
  incomingFiles: readonly { byteLength: number }[],
): void {
  assertProductImageCount(existingImages.length, incomingFiles.length);

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

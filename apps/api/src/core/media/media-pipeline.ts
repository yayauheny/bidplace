import type { MediaPurpose } from '@bidplace/database';
import { BadRequestException, Injectable } from '@nestjs/common';
import sharp, { type Metadata } from 'sharp';
import {
  type RawImageUpload,
  type SupportedImageMimeType,
  type ValidatedImageUpload,
  detectImageMimeType,
  supportedImageMimeTypes,
  productImageUploadLimits,
  productImagePixelBudgets,
  workImageMaxInputBytes,
  workImageInputPixelBudgets,
} from '../../images/image-upload-policy';
import {
  ImageProcessor,
  type ProcessedMedia,
} from '../../images/image-processor';
import { withImageProcessingAdmission } from '../../images/image-processing-admission';
import { mediaChecksum } from './media-object-store';

@Injectable()
export class SharpImageProcessor extends ImageProcessor {
  async process(
    file: RawImageUpload,
    purpose: MediaPurpose,
    preserveSource = false,
  ) {
    return withImageProcessingAdmission(async () => {
      const maxInputBytes =
        purpose === 'WORK_IMAGE' && !preserveSource
          ? workImageMaxInputBytes
          : productImageUploadLimits.maxFileBytes;
      const metadata = await validateImage(
        file,
        maxInputBytes,
        purpose === 'WORK_IMAGE' && !preserveSource
          ? workImageInputPixelBudgets
          : productImagePixelBudgets,
      );
      const maxBytes =
        purpose === 'AUTHOR_PHOTO'
          ? 2 * 1024 * 1024
          : productImageUploadLimits.maxFileBytes;
      const source = preserveSource
        ? {
            buffer: file.buffer,
            mimeType: file.mimetype,
            width: metadata.width!,
            height: metadata.height!,
          }
        : await optimizeSource(file, metadata, maxBytes).catch(() => {
            throw new BadRequestException(
              `${file.mimetype} payload is corrupted or not decodable`,
            );
          });
      const result: ProcessedMedia[] = [
        {
          variant: 'SOURCE',
          bytes: source.buffer,
          mimeType: source.mimeType,
          sha256: mediaChecksum(source.buffer),
          width: source.width,
          height: source.height,
          extension: source.mimeType.split('/')[1]!,
        },
      ];
      const settings =
        purpose === 'WORK_IMAGE' || purpose === 'STORY_IMAGE'
          ? [
              { variant: 'PREVIEW' as const, edge: 1600, quality: 82 },
              { variant: 'FULL' as const, edge: 3840, quality: 90 },
            ]
          : [
              {
                variant: 'PREVIEW' as const,
                edge: purpose === 'AUTHOR_PHOTO' ? 800 : 1600,
                quality: 82,
              },
            ];
      for (const setting of settings) {
        const image = await imageInput(source.buffer)
          .rotate()
          .toColourspace('srgb')
          .resize({
            width: setting.edge,
            height: setting.edge,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: setting.quality })
          .toBuffer({ resolveWithObject: true });
        result.push({
          variant: setting.variant,
          bytes: image.data,
          mimeType: 'image/webp',
          sha256: mediaChecksum(image.data),
          width: image.info.width,
          height: image.info.height,
          extension: 'webp',
        });
      }
      return result;
    });
  }
}

function imageInput(buffer: Buffer) {
  return sharp(buffer, {
    animated: false,
    limitInputPixels: workImageInputPixelBudgets.maxPixels,
  });
}

async function optimizeSource(
  file: RawImageUpload,
  metadata: Metadata,
  maxBytes: number,
) {
  const format =
    file.mimetype === 'image/png'
      ? 'png'
      : file.mimetype === 'image/webp'
        ? 'webp'
        : 'jpeg';
  const fitsDimensions =
    Math.max(metadata.width!, metadata.height!) <= productImagePixelBudgets.maxEdgePx;
  if (
    fitsDimensions && file.buffer.length <= maxBytes &&
    (format === 'jpeg' || metadata.bitsPerSample === 16)
  ) {
    await imageInput(file.buffer).raw().toBuffer();
    return {
      buffer: file.buffer,
      mimeType: file.mimetype,
      width: metadata.width!,
      height: metadata.height!,
    };
  }
  if (format !== 'jpeg' && fitsDimensions && metadata.bitsPerSample !== 16) {
    const lossless = await imageInput(file.buffer)
      .keepMetadata()
      .toFormat(format, format === 'webp' ? { lossless: true } : {})
      .toBuffer({ resolveWithObject: true });
    if (
      lossless.data.length <= maxBytes &&
      lossless.data.length < file.buffer.length
    ) {
      return {
        buffer: lossless.data,
        mimeType: file.mimetype,
        width: lossless.info.width,
        height: lossless.info.height,
      };
    }
    if (file.buffer.length <= maxBytes)
      return {
        buffer: file.buffer,
        mimeType: file.mimetype,
        width: metadata.width!,
        height: metadata.height!,
      };
  }
  const outputFormat = metadata.hasAlpha ? 'webp' : 'jpeg';
  const edge = Math.min(
    Math.max(metadata.width!, metadata.height!),
    productImagePixelBudgets.maxEdgePx,
  );
  // Retry from the input, retaining at least 1600px for large artwork masters.
  for (const [maxEdge, quality] of [
    [edge, 90],
    [edge, 82],
    [edge, 70],
    [Math.min(edge, 2560), 82],
    [Math.min(edge, 1600), 80],
    [Math.min(edge, 1600), 60],
  ]) {
    const image = await imageInput(file.buffer)
      .rotate()
      .toColourspace('srgb')
      .resize({
        width: maxEdge,
        height: maxEdge,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(outputFormat, { quality })
      .toBuffer({ resolveWithObject: true });
    if (image.data.length <= maxBytes)
      return {
        buffer: image.data,
        mimeType: `image/${outputFormat}`,
        width: image.info.width,
        height: image.info.height,
      };
  }
  throw new Error('Image encoder exceeded its bounded output budget');
}

async function validateImage(
  file: RawImageUpload,
  maxFileBytes: number,
  pixelBudget: { maxEdgePx: number; maxPixels: number } = productImagePixelBudgets,
): Promise<Metadata> {
  if (!file.buffer?.length)
    throw new BadRequestException('Image file is empty');
  if (file.buffer.length > maxFileBytes)
    throw new BadRequestException(
      `Each image must be at most ${maxFileBytes} bytes`,
    );
  assertSupportedMimeType(file.mimetype);
  const detected = detectImageMimeType(file.buffer);
  if (!detected) throw new BadRequestException('Unsupported image type');
  if (detected !== file.mimetype)
    throw new BadRequestException(
      'Image MIME type does not match file contents',
    );
  let metadata: Metadata;
  try {
    metadata = await sharp(file.buffer, {
      animated: true,
      limitInputPixels: pixelBudget.maxPixels,
    }).metadata();
  } catch {
    throw new BadRequestException(
      `${detected} payload is corrupted or not decodable`,
    );
  }
  assertStaticImageMetadata(detected, metadata, pixelBudget);
  return metadata;
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
  pixelBudget: { maxEdgePx: number; maxPixels: number },
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
    width > pixelBudget.maxEdgePx ||
    height > pixelBudget.maxEdgePx
  ) {
    throw new BadRequestException(
      `Image dimensions cannot exceed ${pixelBudget.maxEdgePx}px on either edge`,
    );
  }

  if (width * height > pixelBudget.maxPixels) {
    throw new BadRequestException(
      `Image cannot exceed ${pixelBudget.maxPixels} pixels`,
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
  return withImageProcessingAdmission(() =>
    normalizeProductImageUploads(files),
  );
}

async function normalizeProductImageUploads(
  files: readonly RawImageUpload[],
): Promise<ValidatedImageUpload[]> {
  const validated: ValidatedImageUpload[] = [];

  for (const file of files) {
    await validateImage(file, productImageUploadLimits.maxFileBytes);
    const detectedMimeType = file.mimetype as SupportedImageMimeType;

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

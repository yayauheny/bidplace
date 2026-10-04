import { ServiceUnavailableException } from '@nestjs/common';
import type { MediaPurpose } from '@bidplace/database';
import sharp from 'sharp';
import {
  type RawImageUpload,
  productImagePixelBudgets,
  validateAndNormalizeProductImageUploads,
} from '../../images/image-policy';
import { mediaChecksum } from './media-object-store';

let admissions = 0;
export async function buildMediaPipeline(
  file: RawImageUpload,
  purpose: MediaPurpose,
) {
  if (admissions >= 2)
    throw new ServiceUnavailableException(
      'Image processing is busy; retry later',
    );
  admissions += 1;
  try {
    const [validated] = await validateAndNormalizeProductImageUploads([file]);
    if (!validated?.width || !validated.height)
      throw new Error('Image dimensions are missing');
    const metadata = await sharp(file.buffer, {
      limitInputPixels: productImagePixelBudgets.maxPixels,
    }).metadata();
    if (!metadata.width || !metadata.height)
      throw new Error('SOURCE dimensions are missing');
    const source = {
      variant: 'SOURCE' as const,
      bytes: file.buffer,
      mimeType: file.mimetype,
      sha256: mediaChecksum(file.buffer),
      width: metadata.width,
      height: metadata.height,
      extension: file.mimetype.split('/')[1],
    };
    const variants = [source];
    const settings =
      purpose === 'WORK_IMAGE'
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
    const derivatives = [];
    for (const setting of settings) {
      const result = await sharp(file.buffer, {
        animated: false,
        limitInputPixels: productImagePixelBudgets.maxPixels,
      })
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
      derivatives.push({
        variant: setting.variant,
        bytes: result.data,
        mimeType: 'image/webp',
        sha256: mediaChecksum(result.data),
        width: result.info.width,
        height: result.info.height,
        extension: 'webp',
      });
    }
    return [...variants, ...derivatives];
  } finally {
    admissions -= 1;
  }
}

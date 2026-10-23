import type { MediaPurpose } from '@bidplace/database';
import type { RawImageUpload } from './image-policy';

export type ProcessedMedia = {
  variant: 'SOURCE' | 'PREVIEW' | 'FULL';
  bytes: Buffer;
  mimeType: string;
  sha256: string;
  width: number;
  height: number;
  extension: string;
};

export abstract class ImageProcessor {
  abstract process(
    file: RawImageUpload,
    purpose: MediaPurpose,
    preserveSource?: boolean,
  ): Promise<ProcessedMedia[]>;
}

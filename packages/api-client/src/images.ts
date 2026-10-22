import { z } from 'zod';
import {
  productImageOrderRequestSchema,
  uuidSchema,
} from '@bidplace/contracts';

import {
  requestBlob,
  requestJson,
  signalRequestOptions,
  type RequestContext,
  type ReadCallOptions,
} from './request';

const imageUploadResponseSchema = z.object({ ok: z.literal(true) }).strict();
const storyImageUploadResponseSchema = z
  .object({ mediaAssetId: uuidSchema })
  .strict();

export function createImagesClient(context: RequestContext) {
  return {
    getImage(imageId: string, options?: ReadCallOptions) {
      return requestBlob(context, `/api/images/${imageId}`, options);
    },
    getStoryImage(
      productId: string,
      mediaAssetId: string,
      options?: ReadCallOptions,
    ) {
      return requestBlob(
        context,
        `/api/products/${productId}/story-images/${mediaAssetId}`,
        options,
      );
    },
    async add(
      productId: string,
      images: Blob[],
      idempotencyKey?: string,
      options?: ReadCallOptions,
    ) {
      if (idempotencyKey) {
        for (const [index, image] of images.entries()) {
          await requestJson(
            context,
            `/api/products/${productId}/images`,
            imageUploadResponseSchema,
            {
              method: 'POST',
              body: { images: [image] },
              asFormData: true,
              ...signalRequestOptions(options),
              headers: { 'Idempotency-Key': `${idempotencyKey}:${index}` },
            },
          );
        }
        return { ok: true as const };
      }
      return requestJson(
        context,
        `/api/products/${productId}/images`,
        imageUploadResponseSchema,
        {
          method: 'POST',
          body: { images },
          ...signalRequestOptions(options),
          asFormData: true,
        },
      );
    },
    addStoryImage(productId: string, image: Blob, idempotencyKey: string) {
      return requestJson(
        context,
        `/api/products/${productId}/story-images`,
        storyImageUploadResponseSchema,
        {
          method: 'POST',
          body: { image },
          asFormData: true,
          headers: { 'Idempotency-Key': idempotencyKey },
        },
      );
    },
    removeStoryImage(productId: string, mediaAssetId: string) {
      return requestJson(
        context,
        `/api/products/${productId}/story-images/${mediaAssetId}`,
        imageUploadResponseSchema,
        { method: 'DELETE' },
      );
    },
    addCreationStepImage(productId: string, stepId: string, image: Blob) {
      return requestJson(
        context,
        `/api/products/${productId}/creation-steps/${stepId}/image`,
        imageUploadResponseSchema,
        {
          method: 'POST',
          body: { image },
          asFormData: true,
        },
      );
    },
    remove(productId: string, imageId: string) {
      return requestJson(
        context,
        `/api/products/${productId}/images/${imageId}`,
        imageUploadResponseSchema,
        { method: 'DELETE' },
      );
    },
    reorder(productId: string, imageIds: string[]) {
      return requestJson(
        context,
        `/api/products/${productId}/images/order`,
        imageUploadResponseSchema,
        {
          method: 'PATCH',
          body: productImageOrderRequestSchema.parse({ imageIds }),
        },
      );
    },
  };
}

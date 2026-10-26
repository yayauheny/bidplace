import { z } from 'zod';
import {
  productImageOrderRequestSchema,
  workPhotoResultSchema,
  workPhotoUploadResponseSchema,
  workPhotoEditRequestSchema,
  type WorkPhotoEditRequest,
  type WorkPhotoResult,
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
    getImageSource(imageId: string, options?: ReadCallOptions) {
      return requestBlob(
        context,
        `/api/images/${imageId}?source=true`,
        options,
      );
    },
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
      revisionId?: string,
    ) {
      if (idempotencyKey) {
        const photos: WorkPhotoResult[] = [];
        for (const [index, image] of images.entries()) {
          const result = await requestJson(
            context,
            `/api/products/${productId}/images`,
            workPhotoUploadResponseSchema,
            {
              method: 'POST',
              body: { images: [image] },
              asFormData: true,
              ...signalRequestOptions(options),
              headers: {
                'Idempotency-Key': `${idempotencyKey}:${index}`,
                'X-Photo-Response': 'slots',
                ...(revisionId ? { 'X-Photo-Revision': revisionId } : {}),
              },
            },
          );
          photos.push(...result.photos);
        }
        return { ok: true as const, photos };
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
    photoOperation(productId: string, operationKey: string, slotId?: string) {
      return requestJson(
        context,
        `/api/products/${productId}/image-operations/${encodeURIComponent(operationKey)}${slotId ? `?slotId=${encodeURIComponent(slotId)}` : ''}`,
        z.object({ photo: workPhotoResultSchema.nullable() }).strict(),
      );
    },
    editPhoto(
      productId: string,
      slotId: string,
      request: WorkPhotoEditRequest,
      image?: Blob,
      options?: ReadCallOptions,
    ) {
      const data = workPhotoEditRequestSchema.parse(request);
      return requestJson(
        context,
        `/api/products/${productId}/photos/${slotId}`,
        z
          .object({ ok: z.literal(true), photo: workPhotoResultSchema })
          .strict(),
        {
          method: image ? 'POST' : 'PATCH',
          body: image ? { data: JSON.stringify(data), images: [image] } : data,
          ...(image
            ? {
                asFormData: true,
                headers: { 'Idempotency-Key': request.operationKey },
              }
            : {}),
          ...signalRequestOptions(options),
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
    remove(productId: string, imageId: string, revisionId?: string) {
      return requestJson(
        context,
        `/api/products/${productId}/images/${imageId}${revisionId ? `?revisionId=${encodeURIComponent(revisionId)}` : ''}`,
        imageUploadResponseSchema,
        { method: 'DELETE' },
      );
    },
    reorder(productId: string, imageIds: string[], revisionId?: string) {
      return requestJson(
        context,
        `/api/products/${productId}/images/order`,
        imageUploadResponseSchema,
        {
          method: 'PATCH',
          body: productImageOrderRequestSchema.parse({
            imageIds,
            ...(revisionId ? { revisionId } : {}),
          }),
        },
      );
    },
  };
}

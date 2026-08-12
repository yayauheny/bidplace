import { z } from 'zod';
import { productImageOrderRequestSchema } from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

const imageUploadResponseSchema = z.object({ ok: z.literal(true) }).strict();

export function createImagesClient(context: RequestContext) {
  return {
    add(productId: string, images: Blob[]) {
      return requestJson(
        context,
        `/api/products/${productId}/images`,
        imageUploadResponseSchema,
        {
          method: 'POST',
          body: { images },
          asFormData: true,
        },
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

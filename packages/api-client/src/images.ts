import { z } from 'zod';

import { requestJson, type RequestContext } from './request';

const imageUploadResponseSchema = z.object({ ok: z.literal(true) }).strict();

export function createImagesClient(context: RequestContext) {
  return {
    add(productId: string, images: Blob[]) {
      return requestJson(context, `/api/products/${productId}/images`, imageUploadResponseSchema, {
        method: 'POST',
        body: { images },
        asFormData: true,
      });
    },
  };
}

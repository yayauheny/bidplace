import { BadRequestException } from '@nestjs/common';
import { z, type ZodTypeAny } from 'zod';

import { parseBody } from '../core/validation';

/**
 * Seller profile writes carry JSON fields in one `data` part of multipart
 * requests, so `null` (clear a nullable field) survives transport. Plain JSON
 * requests keep the schema body unchanged.
 */
export const sellerProfileMultipartDataField = 'data';

const multipartEnvelopeSchema = z
  .object({ [sellerProfileMultipartDataField]: z.string() })
  .strict();

export type ContentTypeRequest = {
  headers: { 'content-type'?: string | string[] | undefined };
};

function isMultipartRequest(request: ContentTypeRequest): boolean {
  const contentType = request.headers['content-type'];
  const value = Array.isArray(contentType) ? contentType[0] : contentType;
  return value?.toLowerCase().startsWith('multipart/form-data') ?? false;
}

function parseMultipartData(body: unknown): unknown {
  const { data } = parseBody(multipartEnvelopeSchema, body);
  try {
    return JSON.parse(data);
  } catch {
    throw new BadRequestException(
      `${sellerProfileMultipartDataField} must be a JSON object`,
    );
  }
}

export function parseSellerProfileWriteBody<T extends ZodTypeAny>(
  schema: T,
  body: unknown,
  request: ContentTypeRequest,
): z.output<T> {
  const payload = isMultipartRequest(request) ? parseMultipartData(body) : body;
  return parseBody(schema, payload);
}

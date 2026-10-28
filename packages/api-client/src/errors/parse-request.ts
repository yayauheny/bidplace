import { ApiErrorCode, type ValidationErrorDetails } from '@bidplace/contracts';
import { type ZodType, ZodError } from 'zod';

import { ApiClientError } from './api-client-error';

export function validationDetailsFromZod(error: ZodError): ValidationErrorDetails {
  const flattened = error.flatten();
  const fieldErrors = Object.fromEntries(
    Object.entries(flattened.fieldErrors).flatMap(([field, messages]) =>
      messages && messages.length > 0 ? [[field, messages]] : [],
    ),
  );

  return {
    formErrors: flattened.formErrors,
    fieldErrors,
  };
}

export function parseRequest<T>(schema: ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (parsed.success) return parsed.data;

  throw new ApiClientError('Request validation failed', {
    kind: 'validation',
    status: 400,
    code: ApiErrorCode.VALIDATION_ERROR,
    details: validationDetailsFromZod(parsed.error),
  });
}

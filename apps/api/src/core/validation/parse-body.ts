import { type ZodTypeAny, z } from 'zod';

import { createValidationException } from './validation-exception';

export function parseBody<T extends ZodTypeAny>(
  schema: T,
  body: unknown,
): z.output<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw createValidationException(result.error);
  }

  return result.data;
}

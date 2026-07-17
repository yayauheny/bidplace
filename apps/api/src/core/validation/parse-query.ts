import { type ZodTypeAny, z } from 'zod';

import { createValidationException } from './validation-exception';

export function parseQuery<T extends ZodTypeAny>(
  schema: T,
  query: unknown,
): z.output<T> {
  const result = schema.safeParse(query);

  if (!result.success) {
    throw createValidationException(result.error);
  }

  return result.data;
}

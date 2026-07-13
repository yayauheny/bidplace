import { BadRequestException } from '@nestjs/common';
import { type ZodTypeAny, z } from 'zod';

export function parseQuery<T extends ZodTypeAny>(
  schema: T,
  query: unknown,
): z.output<T> {
  const result = schema.safeParse(query);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

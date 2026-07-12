import { BadRequestException } from '@nestjs/common';
import { type ZodTypeAny, z } from 'zod';

export function parseBody<T extends ZodTypeAny>(
  schema: T,
  body: unknown,
): z.output<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

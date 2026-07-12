import { BadRequestException } from '@nestjs/common';
import { z, type ZodTypeAny } from 'zod';

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

export function extractBearerToken(header: string | null | undefined): string {
  if (!header) {
    throw new Error('Missing authorization header');
  }

  const [scheme, token, ...rest] = header.trim().split(/\s+/);

  if (scheme !== 'Bearer' || !token || rest.length > 0) {
    throw new Error('Invalid authorization header');
  }

  return token;
}

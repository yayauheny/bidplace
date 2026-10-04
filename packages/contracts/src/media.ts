import { z } from 'zod';
export const publicMediaUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      !url.hostname.endsWith('.r2.dev') &&
      /^\/assets\/[a-f0-9-]{36}\/p1\/(preview|full)\.webp$/.test(url.pathname)
    );
  }, 'Expected an HTTPS public derivative URL');
export const mediaDeliverySchema = z
  .object({
    id: z.string().uuid(),
    state: z.enum(['PENDING', 'RUNNING', 'FAILED', 'DONE', 'CANCELLED']),
    kind: z.enum(['PUBLISH', 'REVOKE', 'CLEANUP']),
    attemptCount: z.number().int().nonnegative(),
  })
  .strict();

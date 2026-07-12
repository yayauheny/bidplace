import { z } from 'zod';

import { isoDateTimeSchema, slugSchema, uuidSchema } from './primitives';

export const categorySchema = z
  .object({
    id: uuidSchema,
    slug: slugSchema,
    name: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable(),
    createdAt: isoDateTimeSchema.optional(),
    updatedAt: isoDateTimeSchema.optional(),
  })
  .strict();

export type Category = z.infer<typeof categorySchema>;

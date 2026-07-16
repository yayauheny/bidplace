import { z } from 'zod';

import { lotStatusSchema } from './enums';
import { isoDateTimeSchema, uuidSchema } from './primitives';

export const lotSchema = z
  .object({
    id: uuidSchema,
    sellerProfileId: uuidSchema,
    categoryId: uuidSchema,
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    condition: z.string().trim().min(1),
    images: z.array(z.string().min(1)),
    status: lotStatusSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const lotCreateRequestSchema = z
  .object({
    categoryId: uuidSchema,
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    condition: z.string().trim().min(1),
  })
  .strict();

export const lotUpdateRequestSchema = lotCreateRequestSchema.partial().strict();

export const lotImageReorderRequestSchema = z
  .object({
    imageIds: z.array(uuidSchema).min(1),
  })
  .strict()
  .refine(
    ({ imageIds }) => new Set(imageIds).size === imageIds.length,
    {
      message: 'imageIds must not contain duplicates',
      path: ['imageIds'],
    },
  );

export const lotResponseSchema = z
  .object({
    lot: lotSchema,
  })
  .strict();

export type Lot = z.infer<typeof lotSchema>;
export type LotCreateRequest = z.infer<typeof lotCreateRequestSchema>;
export type LotUpdateRequest = z.infer<typeof lotUpdateRequestSchema>;
export type LotImageReorderRequest = z.infer<typeof lotImageReorderRequestSchema>;
export type LotResponse = z.infer<typeof lotResponseSchema>;

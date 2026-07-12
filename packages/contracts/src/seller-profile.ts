import { z } from 'zod';

import { sellerStatusSchema, sellerTypeSchema } from './enums';
import { isoDateTimeSchema, slugSchema, uuidSchema } from './primitives';

export const sellerProfileSchema = z
  .object({
    id: uuidSchema,
    userId: uuidSchema,
    slug: slugSchema,
    sellerType: sellerTypeSchema,
    storeName: z.string().trim().min(1),
    country: z.string().trim().min(1),
    contactPreference: z.string().trim().min(1),
    socialLink: z.string().url().nullable(),
    shortDescription: z.string().trim().min(1).nullable(),
    status: sellerStatusSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const sellerProfileCreateRequestSchema = z
  .object({
    slug: slugSchema,
    sellerType: sellerTypeSchema,
    storeName: z.string().trim().min(1),
    country: z.string().trim().min(1),
    contactPreference: z.string().trim().min(1),
    socialLink: z.string().url().nullable().optional(),
    shortDescription: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export const sellerProfileUpdateRequestSchema =
  sellerProfileCreateRequestSchema.partial().strict();

export type SellerProfile = z.infer<typeof sellerProfileSchema>;
export type SellerProfileCreateRequest = z.infer<
  typeof sellerProfileCreateRequestSchema
>;
export type SellerProfileUpdateRequest = z.infer<
  typeof sellerProfileUpdateRequestSchema
>;

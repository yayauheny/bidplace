import { z } from 'zod';

import { publicProductListItemSchema } from './public-product';
import { publicSellerListItemSchema } from './public-seller';
import { paginationQuerySchema } from './pagination';
import { uuidSchema } from './primitives';

const publicListingStatusSchema = z.enum(['SCHEDULED', 'LIVE', 'ENDED']);

export const publicDiscoverySortSchema = z.enum([
  'activity',
  'endingSoon',
  'newest',
  'priceAsc',
  'priceDesc',
]);

const materialsQuerySchema = z.preprocess(
  (value) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((material) => material.trim())
          .filter(Boolean)
      : value,
  z.array(z.string().trim().min(1).max(80)).max(20),
);

export const publicDiscoveryQuerySchema = paginationQuerySchema
  .extend({
    q: z.string().trim().min(1).max(120).optional(),
    author: z.string().trim().min(1).max(120).optional(),
    status: publicListingStatusSchema.optional(),
    category: uuidSchema.optional(),
    materials: materialsQuerySchema.optional(),
    uniqueness: z.string().trim().min(1).max(160).optional(),
    priceMin: z.coerce.number().finite().nonnegative().optional(),
    priceMax: z.coerce.number().finite().nonnegative().optional(),
    yearFrom: z.coerce.number().int().min(0).max(9999).optional(),
    yearTo: z.coerce.number().int().min(0).max(9999).optional(),
    sort: publicDiscoverySortSchema.default('newest'),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.priceMin !== undefined &&
      value.priceMax !== undefined &&
      value.priceMax < value.priceMin
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['priceMax'],
        message: 'priceMax must be greater than or equal to priceMin',
      });
    }

    if (
      value.yearFrom !== undefined &&
      value.yearTo !== undefined &&
      value.yearTo < value.yearFrom
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['yearTo'],
        message: 'yearTo must be greater than or equal to yearFrom',
      });
    }
  });

export const publicSellerSortSchema = z.enum(['activity', 'name']);

export const publicSellerQuerySchema = paginationQuerySchema
  .extend({
    q: z.string().trim().min(1).max(120).optional(),
    sort: publicSellerSortSchema.default('activity'),
  })
  .strict();

export const publicHomeResponseSchema = z
  .object({
    topAuctions: z.array(publicProductListItemSchema),
    creators: z.array(publicSellerListItemSchema),
    newWorks: z.array(publicProductListItemSchema),
  })
  .strict();

export type PublicDiscoveryQueryInput = z.input<
  typeof publicDiscoveryQuerySchema
>;
export type PublicDiscoveryQuery = z.output<typeof publicDiscoveryQuerySchema>;
export type PublicDiscoverySort = z.infer<typeof publicDiscoverySortSchema>;
export type PublicSellerQueryInput = z.input<typeof publicSellerQuerySchema>;
export type PublicSellerQuery = z.output<typeof publicSellerQuerySchema>;
export type PublicSellerSort = z.infer<typeof publicSellerSortSchema>;
export type PublicHomeResponse = z.infer<typeof publicHomeResponseSchema>;

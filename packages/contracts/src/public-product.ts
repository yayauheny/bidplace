import { z } from 'zod';
import { creationStepSchema, productSchema } from './product';
import { publicSellerProfileSchema } from './seller-profile';
import { paginationMetaSchema } from './pagination';

export const publicProductSchema = productSchema
  .extend({
    categoryId: z.string().uuid(),
    title: z.string().trim().min(1),
    story: z.string().trim().min(1),
    uniqueness: z.string().trim().min(1),
    provenance: z.string().trim().min(1),
    city: z.string().trim().min(1),
    deliveryInfo: z.string().trim().min(1),
    images: productSchema.shape.images.nonempty(),
  })
  .strict();

export const publicProductListItemSchema = z
  .object({
    product: publicProductSchema,
    sellerProfile: publicSellerProfileSchema,
  })
  .strict();
export const publicDiscoveryFacetsSchema = z
  .object({
    categories: z.array(
      z
        .object({
          id: z.string().uuid(),
          name: z.string().min(1),
          count: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    authors: z.array(
      z
        .object({
          slug: z.string().trim().min(1),
          name: z.string().trim().min(1),
          count: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    materials: z.array(z.string().min(1)),
    uniquenesses: z.array(z.string().trim().min(1)),
  })
  .strict();
export const productListResponseSchema = z
  .object({
    products: z.array(publicProductListItemSchema),
    pagination: paginationMetaSchema,
    facets: publicDiscoveryFacetsSchema,
  })
  .strict();
export const publicProductDetailResponseSchema = z
  .object({
    product: publicProductSchema,
    sellerProfile: publicSellerProfileSchema,
    creationIntro: z.string().trim().min(1).nullable(),
    creationSteps: z.array(creationStepSchema),
  })
  .strict();

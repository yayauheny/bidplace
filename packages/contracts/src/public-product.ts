import { z } from 'zod'; import { listingSchema } from './listing'; import { productSchema } from './product'; import { sellerProfileSchema } from './seller-profile';
export const publicProductListItemSchema = z.object({ product: productSchema, sellerProfile: sellerProfileSchema, listing: listingSchema.nullable() }).strict();
export const productListResponseSchema = z.object({ products: z.array(publicProductListItemSchema) }).strict();
export const publicProductDetailResponseSchema = z.object({ product: productSchema, sellerProfile: sellerProfileSchema, listing: listingSchema.nullable() }).strict();

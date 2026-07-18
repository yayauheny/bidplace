import { z } from 'zod'; import { listingSchema } from './listing'; import { productSchema } from './product'; import { publicSellerProfileSchema } from './public-seller'; import { moneyAmountSchema } from './primitives';
export const publicProductListItemSchema = z.object({ product: productSchema, sellerProfile: publicSellerProfileSchema, listing: listingSchema.nullable() }).strict();
export const productListResponseSchema = z.object({ products: z.array(publicProductListItemSchema) }).strict();
export const publicProductDetailResponseSchema = z.object({ product: productSchema, sellerProfile: publicSellerProfileSchema, listing: listingSchema.nullable(), minimumNextBid: moneyAmountSchema.nullable() }).strict();

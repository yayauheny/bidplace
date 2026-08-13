import { z } from 'zod'; import { listingSchema } from './listing';
export const activityStatusSchema = z.enum(['LEADING', 'OUTBID', 'WON', 'LOST', 'AWAITING_SELLER_CONTACT', 'WIN_CANCELLED', 'COMPLETED']);
export type ActivityStatus = z.infer<typeof activityStatusSchema>;
export const activityResponseSchema = z.object({ activity: z.array(z.object({ status: activityStatusSchema, listing: listingSchema, product: z.object({ publicId: z.string(), title: z.string() }).strict(), orderPublicId: z.string().nullable() }).strict()) }).strict();

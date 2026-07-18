import { z } from 'zod';

import { listingSchema } from './listing';
import { userSchema } from './user';

export const adminUsersResponseSchema = z
  .object({
    users: z.array(userSchema),
  })
  .strict();

export const adminListingsResponseSchema = z
  .object({
    listings: z.array(listingSchema),
  })
  .strict();

export const adminUserResponseSchema = z
  .object({
    user: userSchema,
  })
  .strict();

export const adminListingResponseSchema = z
  .object({
    listing: listingSchema,
  })
  .strict();

export type AdminUsersResponse = z.infer<typeof adminUsersResponseSchema>;
export type AdminListingsResponse = z.infer<
  typeof adminListingsResponseSchema
>;
export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;
export type AdminListingResponse = z.infer<typeof adminListingResponseSchema>;

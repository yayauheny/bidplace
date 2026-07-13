import { z } from 'zod';

import { auctionSchema } from './auction';
import { userSchema } from './user';

export const adminUsersResponseSchema = z
  .object({
    users: z.array(userSchema),
  })
  .strict();

export const adminAuctionsResponseSchema = z
  .object({
    auctions: z.array(auctionSchema),
  })
  .strict();

export const adminUserResponseSchema = z
  .object({
    user: userSchema,
  })
  .strict();

export const adminAuctionResponseSchema = z
  .object({
    auction: auctionSchema,
  })
  .strict();

export type AdminUsersResponse = z.infer<typeof adminUsersResponseSchema>;
export type AdminAuctionsResponse = z.infer<
  typeof adminAuctionsResponseSchema
>;
export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;
export type AdminAuctionResponse = z.infer<typeof adminAuctionResponseSchema>;

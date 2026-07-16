import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'user']);
export const userStatusSchema = z.enum(['active', 'banned']);
export const sellerTypeSchema = z.enum(['creator', 'influencer']);
export const sellerStatusSchema = z.enum([
  'draft',
  'active',
  'restricted',
  'suspended',
]);
export const lotStatusSchema = z.enum([
  'draft',
  'published',
  'sold',
  'hidden',
  'archived',
]);
export const auctionStatusSchema = z.enum([
  'draft',
  'scheduled',
  'active',
  'ended',
  'sold',
  'cancelled',
  'failed',
  'hidden',
]);
export const bidStatusSchema = z.enum([
  'active',
  'winning',
  'outbid',
  'won',
  'lost',
  'cancelled',
  'invalid',
]);

export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type SellerType = z.infer<typeof sellerTypeSchema>;
export type SellerStatus = z.infer<typeof sellerStatusSchema>;
export type LotStatus = z.infer<typeof lotStatusSchema>;
export type AuctionStatus = z.infer<typeof auctionStatusSchema>;
export type BidStatus = z.infer<typeof bidStatusSchema>;

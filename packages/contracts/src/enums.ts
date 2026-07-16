import { z } from 'zod';

export const USER_ROLES = ['admin', 'user'] as const;
export const USER_STATUSES = ['active', 'banned'] as const;
export const SELLER_TYPES = ['creator', 'influencer'] as const;
export const SELLER_STATUSES = [
  'draft',
  'active',
  'restricted',
  'suspended',
] as const;
export const LOT_STATUSES = [
  'draft',
  'published',
  'sold',
  'hidden',
  'archived',
] as const;
export const AUCTION_STATUSES = [
  'draft',
  'scheduled',
  'active',
  'ended',
  'sold',
  'cancelled',
  'failed',
  'hidden',
] as const;
export const BID_STATUSES = [
  'active',
  'winning',
  'outbid',
  'won',
  'lost',
  'cancelled',
  'invalid',
] as const;

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);
export const sellerTypeSchema = z.enum(SELLER_TYPES);
export const sellerStatusSchema = z.enum(SELLER_STATUSES);
export const lotStatusSchema = z.enum(LOT_STATUSES);
export const auctionStatusSchema = z.enum(AUCTION_STATUSES);
export const bidStatusSchema = z.enum(BID_STATUSES);

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type SellerType = (typeof SELLER_TYPES)[number];
export type SellerStatus = (typeof SELLER_STATUSES)[number];
export type LotStatus = (typeof LOT_STATUSES)[number];
export type AuctionStatus = (typeof AUCTION_STATUSES)[number];
export type BidStatus = (typeof BID_STATUSES)[number];

import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'user']);
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

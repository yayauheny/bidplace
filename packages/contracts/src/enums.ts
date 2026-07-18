import { z } from 'zod';

export const USER_ROLES = ['admin', 'user'] as const;
export const USER_STATUSES = ['active', 'banned'] as const;
export const SELLER_TYPES = ['creator', 'influencer'] as const;
export const SELLER_STATUSES = ['DRAFT', 'APPROVED', 'SUSPENDED'] as const;
export const PRODUCT_STATUSES = ['DRAFT', 'APPROVED', 'ARCHIVED'] as const;
export const LISTING_TYPES = ['AUCTION'] as const;
export const LISTING_STATUSES = ['DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'] as const;
export const ORDER_STATUSES = ['PENDING_CONTACT', 'COMPLETED', 'CANCELLED'] as const;
export const ORDER_CANCELLATION_REASONS = ['BUYER_DECLINED', 'BUYER_UNREACHABLE', 'ADMIN_CANCELLED'] as const;

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);
export const sellerTypeSchema = z.enum(SELLER_TYPES);
export const sellerStatusSchema = z.enum(SELLER_STATUSES);
export const productStatusSchema = z.enum(PRODUCT_STATUSES);
export const listingTypeSchema = z.enum(LISTING_TYPES);
export const listingStatusSchema = z.enum(LISTING_STATUSES);
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const orderCancellationReasonSchema = z.enum(ORDER_CANCELLATION_REASONS);

export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type SellerType = z.infer<typeof sellerTypeSchema>;
export type SellerStatus = z.infer<typeof sellerStatusSchema>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type ListingType = z.infer<typeof listingTypeSchema>;
export type ListingStatus = z.infer<typeof listingStatusSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type OrderCancellationReason = z.infer<typeof orderCancellationReasonSchema>;

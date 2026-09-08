import { z } from 'zod';

export const USER_ROLES = ['admin', 'user'] as const;
export const USER_STATUSES = ['active', 'banned'] as const;
export const SELLER_TYPES = ['creator', 'influencer'] as const;
export const SELLER_STATUSES = [
  'PENDING_REVIEW',
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED',
  'SUSPENDED',
] as const;
export const SELLER_PROFILE_REVISION_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED',
] as const;
export const PRODUCT_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
] as const;
export const LISTING_TYPES = ['AUCTION'] as const;
export const LISTING_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'LIVE',
  'ENDED',
  'CANCELLED',
] as const;
export const ORDER_STATUSES = [
  'PENDING_CONTACT',
  'CONTACTED',
  'COMPLETED',
  'HANDOFF_FAILED',
  'CANCELLED',
] as const;
export const ORDER_CANCELLATION_REASONS = [
  'BUYER_DECLINED',
  'BUYER_UNREACHABLE',
  'ADMIN_CANCELLED',
] as const;
export const HANDOFF_CONTACT_TYPES = [
  'TELEGRAM',
  'PHONE',
  'INSTAGRAM',
] as const;
export const HANDOFF_INITIATORS = [
  'BUYER_CONTACTS_SELLER',
  'SELLER_CONTACTS_BUYER',
] as const;
export const AUDIT_TARGET_TYPES = [
  'SELLER_PROFILE',
  'PRODUCT',
  'ORDER',
  'LISTING',
] as const;

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);
export const sellerTypeSchema = z.enum(SELLER_TYPES);
export const sellerStatusSchema = z.enum(SELLER_STATUSES);
export const sellerProfileRevisionStatusSchema = z.enum(
  SELLER_PROFILE_REVISION_STATUSES,
);
export const productStatusSchema = z.enum(PRODUCT_STATUSES);
export const listingTypeSchema = z.enum(LISTING_TYPES);
export const listingStatusSchema = z.enum(LISTING_STATUSES);
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const orderCancellationReasonSchema = z.enum(ORDER_CANCELLATION_REASONS);
export const handoffContactTypeSchema = z.enum(HANDOFF_CONTACT_TYPES);
export const handoffInitiatorSchema = z.enum(HANDOFF_INITIATORS);
export const auditTargetTypeSchema = z.enum(AUDIT_TARGET_TYPES);

export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type SellerType = z.infer<typeof sellerTypeSchema>;
export type SellerStatus = z.infer<typeof sellerStatusSchema>;
export type SellerProfileRevisionStatus = z.infer<
  typeof sellerProfileRevisionStatusSchema
>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type ListingType = z.infer<typeof listingTypeSchema>;
export type ListingStatus = z.infer<typeof listingStatusSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type OrderCancellationReason = z.infer<
  typeof orderCancellationReasonSchema
>;
export type HandoffContactType = z.infer<typeof handoffContactTypeSchema>;
export type HandoffInitiator = z.infer<typeof handoffInitiatorSchema>;
export type AuditTargetType = z.infer<typeof auditTargetTypeSchema>;

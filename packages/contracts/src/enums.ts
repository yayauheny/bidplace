import { z } from 'zod';

export const USER_ROLES = ['admin', 'user'] as const;
export const USER_STATUSES = ['active', 'banned'] as const;
export const SELLER_TYPES = ['creator', 'influencer'] as const;
export const SELLER_STATUSES = [
  'DRAFT',
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
export const AUTHOR_APPLICATION_STAGES = [
  'CONTACTS',
  'ABOUT',
  'ACHIEVEMENTS',
] as const;
export const ACHIEVEMENT_DATE_PRECISIONS = ['MONTH', 'DAY'] as const;
export const PRODUCT_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
] as const;
export const LISTING_TYPES = ['FIXED', 'AUCTION'] as const;
export const LISTING_STATUSES = [
  'SCHEDULED',
  'LIVE',
  'ENDED',
  'CANCELLED',
] as const;
export const ORDER_STATUSES = [
  'OFFERED',
  'ACTIVE',
  'COMPLETED',
  'FAILED',
] as const;
export const AUDIT_TARGET_TYPES = [
  'SELLER_PROFILE',
  'PRODUCT',
  'ORDER',
  'LISTING',
  'REPORT',
] as const;

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);
export const sellerTypeSchema = z.enum(SELLER_TYPES);
export const sellerStatusSchema = z.enum(SELLER_STATUSES);
export const sellerProfileRevisionStatusSchema = z.enum(
  SELLER_PROFILE_REVISION_STATUSES,
);
export const authorApplicationStageSchema = z.enum(AUTHOR_APPLICATION_STAGES);
export const achievementDatePrecisionSchema = z.enum(
  ACHIEVEMENT_DATE_PRECISIONS,
);
export const productStatusSchema = z.enum(PRODUCT_STATUSES);
export const listingTypeSchema = z.enum(LISTING_TYPES);
export const listingStatusSchema = z.enum(LISTING_STATUSES);
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const auditTargetTypeSchema = z.enum(AUDIT_TARGET_TYPES);

export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type SellerType = z.infer<typeof sellerTypeSchema>;
export type SellerStatus = z.infer<typeof sellerStatusSchema>;
export type SellerProfileRevisionStatus = z.infer<
  typeof sellerProfileRevisionStatusSchema
>;
export type AuthorApplicationStage = z.infer<
  typeof authorApplicationStageSchema
>;
export type AchievementDatePrecision = z.infer<
  typeof achievementDatePrecisionSchema
>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type ListingType = z.infer<typeof listingTypeSchema>;
export type ListingStatus = z.infer<typeof listingStatusSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type AuditTargetType = z.infer<typeof auditTargetTypeSchema>;

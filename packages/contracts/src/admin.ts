import { z } from 'zod';

import { userRoleSchema, userStatusSchema } from './enums';
import {
  productStatusSchema,
  sellerStatusSchema,
} from './enums';
import { isoDateTimeSchema, uuidSchema } from './primitives';
import {
  sellerProfileResponseSchema,
  sellerProfileSchema,
} from './seller-profile';
import { creationStepSchema, productSchema } from './product';

const sellerModerationStatusSchema = sellerStatusSchema.extract([
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED',
  'SUSPENDED',
]);

const productModerationStatusSchema = productStatusSchema.extract([
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED',
  'ARCHIVED',
]);

export const adminSellerStatusUpdateRequestSchema = z
  .object({
    status: sellerModerationStatusSchema,
    reason: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      ['CHANGES_REQUESTED', 'REJECTED', 'SUSPENDED'].includes(value.status) &&
      !value.reason
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'reason is required for this seller status',
      });
    }
  });

export const adminProductStatusUpdateRequestSchema = z
  .object({
    status: productModerationStatusSchema,
    reason: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      ['CHANGES_REQUESTED', 'REJECTED', 'ARCHIVED'].includes(value.status) &&
      !value.reason
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'reason is required for this product status',
      });
    }
  });

export const adminUsersLookupQuerySchema = z
  .object({
    email: z.string().email().transform((value) => value.trim().toLowerCase()),
  })
  .strict();

export const adminUserSchema = z
  .object({
    id: uuidSchema,
    email: z.string().email(),
    displayName: z.string().min(1),
    role: userRoleSchema,
    status: userStatusSchema,
  })
  .strict();

export const adminUsersLookupResponseSchema = z
  .object({ users: z.array(adminUserSchema) })
  .strict();

const adminUserIncidentStatusSchema = userStatusSchema.extract([
  'active',
  'banned',
]);

export const adminUserStatusUpdateRequestSchema = z
  .object({
    status: adminUserIncidentStatusSchema,
    reason: z.string().trim().min(1),
  })
  .strict();

export const adminUserRevokeSessionsRequestSchema = z
  .object({
    reason: z.string().trim().min(1),
  })
  .strict();

export const adminUserStatusResponseSchema = adminUserSchema;

export const adminOkResponseSchema = z.object({ ok: z.literal(true) }).strict();

export const adminCuratorSelectionRequestSchema = z
  .object({
    publicId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    note: z.string().trim().min(1).max(2_000).nullable(),
  })
  .strict();

export const adminCuratorSelectionResponseSchema = z
  .object({
    publicId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    productId: uuidSchema,
    selectedAt: isoDateTimeSchema,
    note: z.string().trim().min(1).max(2_000).nullable(),
  })
  .strict();

export const adminSellerStatusResponseSchema = sellerProfileResponseSchema;
export const adminSellerProfileSchema = sellerProfileSchema
  .extend({
    lastModerationReason: z.string().nullable(),
    hasBlockingListing: z.boolean(),
  })
  .strict();
export const adminSellerProfilesResponseSchema = z
  .object({ sellerProfiles: z.array(adminSellerProfileSchema) })
  .strict();
export const adminProductSchema = productSchema
  .extend({
    sellerProfile: z
      .object({
        slug: z.string().min(1),
        fullName: z.string().min(1),
        status: sellerStatusSchema,
      })
      .strict(),
    creationIntro: z.string().trim().min(1).nullable(),
    creationSteps: z.array(creationStepSchema),
    hasBlockingListing: z.boolean(),
    lastModerationReason: z.string().nullable(),
  })
  .strict();
export const adminProductsResponseSchema = z
  .object({ products: z.array(adminProductSchema) })
  .strict();

export type AdminSellerStatusUpdateRequest = z.infer<
  typeof adminSellerStatusUpdateRequestSchema
>;
export type AdminProductStatusUpdateRequest = z.infer<
  typeof adminProductStatusUpdateRequestSchema
>;
export type AdminUsersLookupQuery = z.infer<typeof adminUsersLookupQuerySchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminUsersLookupResponse = z.infer<
  typeof adminUsersLookupResponseSchema
>;
export type AdminUserStatusUpdateRequest = z.infer<
  typeof adminUserStatusUpdateRequestSchema
>;
export type AdminUserRevokeSessionsRequest = z.infer<
  typeof adminUserRevokeSessionsRequestSchema
>;

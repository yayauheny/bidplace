import { z } from 'zod';

import { userRoleSchema, userStatusSchema } from './enums';
import {
  authorApplicationStageSchema,
  productStatusSchema,
  sellerProfileRevisionStatusSchema,
  sellerStatusSchema,
  sellerTypeSchema,
} from './enums';
import { isoDateTimeSchema, slugSchema, uuidSchema } from './primitives';
import { portfolioAchievementSchema } from './portfolio';
import {
  creationStepSchema,
  productImageSchema,
  productSchema,
} from './product';
import {
  sellerDisciplineSchema,
  sellerProfileResponseSchema,
  sellerPublicEmailSchema,
  sellerPublicUrlSchema,
} from './seller-profile';

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

const adminRevisionTargetSchema = z
  .object({
    kind: z.literal('revision'),
    id: uuidSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

const adminSellerParentTargetSchema = z
  .object({
    kind: z.literal('parent'),
    status: sellerStatusSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

const adminProductParentTargetSchema = z
  .object({
    kind: z.literal('parent'),
    status: productStatusSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const adminSellerStatusUpdateRequestSchema = z
  .object({
    target: z.discriminatedUnion('kind', [
      adminRevisionTargetSchema,
      adminSellerParentTargetSchema,
    ]),
    status: sellerModerationStatusSchema,
    reason: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.target.kind === 'revision' &&
      !['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(value.status)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['status'],
        message: 'revision review only accepts approval, changes, or rejection',
      });
    }
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
    target: z.discriminatedUnion('kind', [
      adminRevisionTargetSchema,
      adminProductParentTargetSchema,
    ]),
    status: productModerationStatusSchema,
    reason: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.target.kind === 'revision' &&
      !['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(value.status)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['status'],
        message: 'revision review only accepts approval, changes, or rejection',
      });
    }
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
    email: z
      .string()
      .email()
      .transform((value) => value.trim().toLowerCase()),
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
    curatorSlug: slugSchema,
    note: z.string().trim().min(1).max(2_000).nullable(),
  })
  .strict();

export const adminCuratorSelectionResponseSchema = z
  .object({
    publicId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    productId: uuidSchema,
    curatorSlug: slugSchema,
    selectedAt: isoDateTimeSchema,
    note: z.string().trim().min(1).max(2_000).nullable(),
  })
  .strict();

export const adminSellerStatusResponseSchema = sellerProfileResponseSchema;

const nullableText = z.string().trim().min(1).nullable();

export const adminSellerContentSchema = z
  .object({
    slug: slugSchema,
    fullName: z.string().trim().min(1),
    discipline: sellerDisciplineSchema.nullable(),
    country: z.string().trim().min(1),
    city: nullableText,
    practice: nullableText,
    biography: nullableText,
    socialLink: sellerPublicUrlSchema.nullable(),
    telegramUrl: sellerPublicUrlSchema.nullable(),
    instagramUrl: sellerPublicUrlSchema.nullable(),
    websiteUrl: sellerPublicUrlSchema.nullable(),
    publicEmail: sellerPublicEmailSchema.nullable(),
    shortDescription: nullableText,
  })
  .strict();

export const adminSellerRevisionPhotoSchema = z
  .object({
    url: z
      .string()
      .regex(
        /^\/api\/admin\/seller-profiles\/[0-9a-f-]+\/revisions\/[0-9a-f-]+\/photo$/,
      ),
    mimeType: z.string().trim().min(1),
    byteLength: z.number().int().positive(),
    checksum: z.string().length(64),
  })
  .strict();

export const adminSellerRevisionContentSchema = adminSellerContentSchema
  .extend({
    profilePhoto: adminSellerRevisionPhotoSchema.nullable(),
    achievements: z.array(portfolioAchievementSchema),
  })
  .strict();

export const adminProductRevisionContentSchema = productSchema
  .pick({
    categoryId: true,
    title: true,
    story: true,
    technique: true,
    materials: true,
    dimensions: true,
    weight: true,
    year: true,
    condition: true,
    uniqueness: true,
    provenance: true,
    city: true,
    packaging: true,
    deliveryInfo: true,
    images: true,
  })
  .extend({
    creationIntro: nullableText,
    images: z.array(productImageSchema),
  })
  .strict();

const adminSellerReviewTargetSchema = z
  .object({
    id: uuidSchema,
    version: z.number().int().positive(),
    status: sellerProfileRevisionStatusSchema,
    updatedAt: isoDateTimeSchema,
    submittedAt: isoDateTimeSchema.nullable(),
    content: adminSellerRevisionContentSchema,
  })
  .strict();

const adminProductReviewTargetSchema = z
  .object({
    id: uuidSchema,
    version: z.number().int().positive(),
    status: productStatusSchema,
    updatedAt: isoDateTimeSchema,
    submittedAt: isoDateTimeSchema.nullable(),
    content: adminProductRevisionContentSchema,
  })
  .strict();

export const ADMIN_MODERATION_DEFAULT_LIMIT = 50;
export const ADMIN_MODERATION_MAX_LIMIT = 100;

export const adminModerationFilterSchema = z.enum([
  'ALL',
  'PENDING_REVIEW',
  'APPROVED',
  'CHANGES_REQUESTED',
]);

const adminModerationCursorObjectSchema = z
  .object({
    createdAt: isoDateTimeSchema,
    id: uuidSchema,
  })
  .strict();

export type AdminModerationCursor = z.infer<
  typeof adminModerationCursorObjectSchema
>;

function encodeBase64Url(value: string): string {
  return globalThis
    .btoa(value)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function decodeBase64Url(value: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  if (value.length % 4 === 1) return null;
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  try {
    return globalThis.atob(padded.replaceAll('-', '+').replaceAll('_', '/'));
  } catch {
    return null;
  }
}

export function encodeAdminModerationCursor(
  cursor: AdminModerationCursor,
): string {
  return encodeBase64Url(
    JSON.stringify({
      createdAt: cursor.createdAt,
      id: cursor.id.toLowerCase(),
    }),
  );
}

export function parseAdminModerationCursor(
  value: string,
): AdminModerationCursor | null {
  const json = decodeBase64Url(value.trim());
  if (json == null) return null;
  try {
    const parsed = adminModerationCursorObjectSchema.safeParse(
      JSON.parse(json),
    );
    if (!parsed.success) return null;
    return {
      createdAt: parsed.data.createdAt,
      id: parsed.data.id.toLowerCase(),
    };
  } catch {
    return null;
  }
}

const adminModerationCursorSchema = z
  .string()
  .trim()
  .min(1)
  .superRefine((value, context) => {
    if (!parseAdminModerationCursor(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid moderation cursor',
      });
    }
  });

export const adminModerationListQuerySchema = z
  .object({
    cursor: adminModerationCursorSchema.optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(ADMIN_MODERATION_MAX_LIMIT)
      .default(ADMIN_MODERATION_DEFAULT_LIMIT),
    filter: adminModerationFilterSchema.default('ALL'),
    search: z.string().trim().max(200).optional(),
  })
  .strict()
  .transform((value) => ({
    cursor: value.cursor,
    limit: value.limit,
    filter: value.filter,
    search: value.search ? value.search : undefined,
  }));

export type AdminModerationFilter = z.infer<typeof adminModerationFilterSchema>;
export type AdminModerationListQuery = z.output<
  typeof adminModerationListQuerySchema
>;
export type AdminModerationListQueryInput = {
  cursor?: string;
  limit?: number;
  filter?: AdminModerationFilter;
  search?: string;
};

export const adminSellerProfileSchema = z
  .object({
    id: uuidSchema,
    userId: uuidSchema,
    parentStatus: sellerStatusSchema,
    parentUpdatedAt: isoDateTimeSchema,
    sellerType: sellerTypeSchema,
    applicationStage: authorApplicationStageSchema.nullable(),
    createdAt: isoDateTimeSchema,
    parent: adminSellerContentSchema,
    reviewTarget: adminSellerReviewTargetSchema.nullable(),
    lastModerationReason: z.string().nullable(),
    hasBlockingListing: z.boolean(),
  })
  .strict();
export const adminSellerProfilesResponseSchema = z
  .object({
    sellerProfiles: z.array(adminSellerProfileSchema),
    nextCursor: adminModerationCursorSchema.nullable(),
  })
  .strict();
export const adminProductSchema = z
  .object({
    id: uuidSchema,
    publicId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    sellerProfileId: uuidSchema,
    parentStatus: productStatusSchema,
    parentUpdatedAt: isoDateTimeSchema,
    publishedAt: isoDateTimeSchema.nullable(),
    sellerProfile: z
      .object({
        slug: z.string().min(1),
        fullName: z.string().min(1),
        status: sellerStatusSchema,
      })
      .strict(),
    parent: adminProductRevisionContentSchema,
    creationSteps: z.array(creationStepSchema),
    reviewTarget: adminProductReviewTargetSchema.nullable(),
    hasBlockingListing: z.boolean(),
    lastModerationReason: z.string().nullable(),
  })
  .strict();
export const adminProductsResponseSchema = z
  .object({
    products: z.array(adminProductSchema),
    nextCursor: adminModerationCursorSchema.nullable(),
  })
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
export type AdminSellerProfile = z.infer<typeof adminSellerProfileSchema>;
export type AdminSellerProfilesResponse = z.infer<
  typeof adminSellerProfilesResponseSchema
>;
export type AdminProduct = z.infer<typeof adminProductSchema>;
export type AdminProductsResponse = z.infer<typeof adminProductsResponseSchema>;

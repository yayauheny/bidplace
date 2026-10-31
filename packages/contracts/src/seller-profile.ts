import { publicMediaUrlSchema, mediaDeliverySchema } from './media';
import { z } from 'zod';
import { portfolioAchievementSchema } from './portfolio';

import {
  authorApplicationStageSchema,
  sellerProfileRevisionStatusSchema,
  sellerStatusSchema,
  sellerTypeSchema,
} from './enums';
import { selectedCategorySchema } from './catalog';
import { isCountryCode } from './countries';
import {
  httpsUrlSchema,
  isoDateTimeSchema,
  slugSchema,
  uuidSchema,
} from './primitives';

export const sellerTelegramHandleSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^(?:@[A-Za-z0-9_]{5,32}|https:\/\/t\.me\/[A-Za-z0-9_]{5,32})$/);
export const sellerInstagramHandleSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^(?:@[A-Za-z0-9._]{1,30}|https:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]{1,30})$/,
  );
const sellerProfilePhotoUrlSchema = z.union([
  z.string().regex(/^\/api\/sellers\/[A-Za-z0-9_-]+\/photo$/),
  publicMediaUrlSchema,
]);

export const sellerDisciplineSchema = z.string().trim().min(1).max(160);
export const sellerPublicUrlSchema = httpsUrlSchema;
export const sellerPublicEmailSchema = z
  .string()
  .trim()
  .email('Введите корректный email')
  .max(254)
  .transform((value) => value.toLowerCase());

export const sellerProfileConflictDetailsSchema = z
  .object({
    reason: z.enum(['profile_exists', 'slug_taken']),
  })
  .strict();

const authorNameSchema = z.string().trim().min(1, 'Введите имя или название');
const authorCountrySchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isCountryCode, 'Укажите страну');
const authorCitySchema = z.string().trim().min(1).max(160);

export const sellerProfileSchema = z
  .object({
    id: uuidSchema,
    userId: uuidSchema,
    slug: slugSchema,
    sellerType: sellerTypeSchema,
    discipline: sellerDisciplineSchema.nullable(),
    fullName: z.string().trim().min(1),
    country: z.string().trim().min(1),
    city: z.string().trim().min(1).nullable(),
    practice: z.string().trim().min(1).nullable(),
    biography: z.string().trim().min(1).nullable(),
    profilePhotoUrl: sellerProfilePhotoUrlSchema,
    socialLink: sellerPublicUrlSchema.nullable(),
    telegramUrl: sellerPublicUrlSchema.nullable(),
    instagramUrl: sellerPublicUrlSchema.nullable(),
    websiteUrl: sellerPublicUrlSchema.nullable(),
    publicEmail: sellerPublicEmailSchema.nullable(),
    shortDescription: z.string().trim().min(1).nullable(),
    directionCategoryIds: z.array(uuidSchema).default([]),
    directions: z.array(selectedCategorySchema).default([]),
    status: sellerStatusSchema,
    applicationStage: authorApplicationStageSchema.nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const publicSellerProfileSchema = sellerProfileSchema
  .pick({
    id: true,
    slug: true,
    sellerType: true,
    discipline: true,
    fullName: true,
    profilePhotoUrl: true,
    country: true,
    city: true,
    practice: true,
    biography: true,
    socialLink: true,
    telegramUrl: true,
    instagramUrl: true,
    websiteUrl: true,
    publicEmail: true,
    shortDescription: true,
  })
  .extend({
    discipline: sellerDisciplineSchema.nullable(),
    shortDescription: z.string().trim().min(1),
    directionCategoryIds: z.array(uuidSchema).default([]),
    directions: z.array(selectedCategorySchema).default([]),
    achievements: z.array(portfolioAchievementSchema).optional(),
  });

export const sellerProfileCreateRequestSchema = z
  .object({
    fullName: authorNameSchema,
    country: authorCountrySchema,
    city: authorCitySchema.nullable().optional(),
    directionCategoryIds: z.array(uuidSchema).optional(),
    discipline: sellerDisciplineSchema.optional(),
    practice: z.string().trim().min(1).nullable().optional(),
    biography: z.string().trim().min(1).nullable().optional(),
    socialLink: sellerPublicUrlSchema.nullable().optional(),
    telegramUrl: sellerPublicUrlSchema.nullable().optional(),
    instagramUrl: sellerPublicUrlSchema.nullable().optional(),
    websiteUrl: sellerPublicUrlSchema.nullable().optional(),
    publicEmail: sellerPublicEmailSchema.nullable().optional(),
    shortDescription: z.string().trim().min(1).optional(),
  })
  .strict();

export const sellerProfileUpdateRequestSchema = z
  .object({
    sellerType: sellerTypeSchema.optional(),
    discipline: sellerDisciplineSchema.optional(),
    fullName: authorNameSchema.optional(),
    country: authorCountrySchema.optional(),
    city: authorCitySchema.nullable().optional(),
    directionCategoryIds: z.array(uuidSchema).optional(),
    practice: z.string().trim().min(1).nullable().optional(),
    biography: z.string().trim().min(1).nullable().optional(),
    socialLink: sellerPublicUrlSchema.nullable().optional(),
    telegramUrl: sellerPublicUrlSchema.nullable().optional(),
    instagramUrl: sellerPublicUrlSchema.nullable().optional(),
    websiteUrl: sellerPublicUrlSchema.nullable().optional(),
    publicEmail: sellerPublicEmailSchema.nullable().optional(),
    shortDescription: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export const sellerProfileResponseSchema = z
  .object({
    publication: mediaDeliverySchema.optional(),
    sellerProfile: sellerProfileSchema,
    editingRevision: z
      .object({
        id: uuidSchema,
        version: z.number().int().positive(),
        status: sellerProfileRevisionStatusSchema,
        updatedAt: isoDateTimeSchema,
      })
      .strict()
      .nullable(),
  })
  .strict();

export type SellerProfile = z.infer<typeof sellerProfileSchema>;
export type SellerProfileCreateRequest = z.infer<
  typeof sellerProfileCreateRequestSchema
>;
export type SellerProfileUpdateRequest = z.infer<
  typeof sellerProfileUpdateRequestSchema
>;
export type SellerProfileResponse = z.infer<typeof sellerProfileResponseSchema>;

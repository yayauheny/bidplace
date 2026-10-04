import { publicMediaUrlSchema, mediaDeliverySchema } from './media';
import { z } from 'zod';

import {
  authorApplicationStageSchema,
  handoffContactTypeSchema,
  handoffInitiatorSchema,
  sellerProfileRevisionStatusSchema,
  sellerStatusSchema,
  sellerTypeSchema,
} from './enums';
import {
  achievementOccurredDateSchema,
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
export const sellerPhoneHandleSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^\+[1-9]\d{1,14}$/);

const sellerProfilePhotoUrlSchema = z.union([
  z.string().regex(/^\/api\/sellers\/[A-Za-z0-9_-]+\/photo$/),
  publicMediaUrlSchema,
]);

export const sellerDisciplineSchema = z.string().trim().min(1).max(160);
export const sellerPublicUrlSchema = httpsUrlSchema;
export const sellerPublicEmailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());

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
    handoffContactType: handoffContactTypeSchema.nullable(),
    handoffContactValue: z.string().trim().min(1).nullable(),
    handoffInitiator: handoffInitiatorSchema.nullable(),
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
    discipline: sellerDisciplineSchema,
    shortDescription: z.string().trim().min(1),
    achievements: z
      .array(
        z
          .object({
            id: uuidSchema,
            occurredDate: achievementOccurredDateSchema.nullable(),
            body: z.string().trim().min(1),
            image: z
              .object({
                url: z
                  .string()
                  .regex(/^\/api\/author-achievements\/[0-9a-f-]+\/image$/),
                mimeType: z.string().trim().min(1),
                byteLength: z.number().int().positive(),
                checksum: z.string().length(64),
              })
              .strict()
              .nullable(),
          })
          .strict(),
      )
      .optional(),
  });

export const sellerProfileCreateRequestSchema = z
  .object({
    slug: slugSchema,
    fullName: z.string().trim().min(1),
    country: z.string().trim().min(1),
    city: z.string().trim().min(1),
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
    slug: slugSchema.optional(),
    sellerType: sellerTypeSchema.optional(),
    discipline: sellerDisciplineSchema.optional(),
    fullName: z.string().trim().min(1).optional(),
    country: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).nullable().optional(),
    practice: z.string().trim().min(1).nullable().optional(),
    biography: z.string().trim().min(1).nullable().optional(),
    socialLink: sellerPublicUrlSchema.nullable().optional(),
    telegramUrl: sellerPublicUrlSchema.nullable().optional(),
    instagramUrl: sellerPublicUrlSchema.nullable().optional(),
    websiteUrl: sellerPublicUrlSchema.nullable().optional(),
    publicEmail: sellerPublicEmailSchema.nullable().optional(),
    shortDescription: z.string().trim().min(1).optional(),
    handoffContactType: handoffContactTypeSchema.optional(),
    handoffContactValue: z.string().trim().min(1).optional(),
    handoffInitiator: handoffInitiatorSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const hasContactType = value.handoffContactType !== undefined;
    const hasContactValue = value.handoffContactValue !== undefined;

    if (hasContactType !== hasContactValue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasContactType ? ['handoffContactValue'] : ['handoffContactType'],
        message:
          'handoffContactType and handoffContactValue must be updated together',
      });
    }

    if (value.handoffContactType && value.handoffContactValue) {
      const contactValue = value.handoffContactValue.trim();

      if (
        value.handoffContactType === 'TELEGRAM' &&
        !sellerTelegramHandleSchema.safeParse(contactValue).success
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['handoffContactValue'],
          message:
            'Telegram contact must be @username or https://t.me/username',
        });
      }

      if (
        value.handoffContactType === 'PHONE' &&
        !sellerPhoneHandleSchema.safeParse(contactValue).success
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['handoffContactValue'],
          message: 'Phone contact must be in E.164 format',
        });
      }

      if (
        value.handoffContactType === 'INSTAGRAM' &&
        !sellerInstagramHandleSchema.safeParse(contactValue).success
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['handoffContactValue'],
          message:
            'Instagram contact must be @username or https://instagram.com/username',
        });
      }
    }
  });

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

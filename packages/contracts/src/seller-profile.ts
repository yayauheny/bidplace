import { z } from 'zod';

import {
  handoffContactTypeSchema,
  handoffInitiatorSchema,
  sellerStatusSchema,
  sellerTypeSchema,
} from './enums';
import { isoDateTimeSchema, slugSchema, uuidSchema } from './primitives';

const telegramHandleSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^(?:@[A-Za-z0-9_]{5,32}|https:\/\/t\.me\/[A-Za-z0-9_]{5,32})$/);
const instagramHandleSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^(?:@[A-Za-z0-9._]{1,30}|https:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]{1,30})$/,
  );
const phoneHandleSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^\+[1-9]\d{1,14}$/);

const sellerProfilePhotoUrlSchema = z
  .string()
  .regex(/^\/api\/sellers\/[A-Za-z0-9_-]+\/photo$/);

export const sellerProfileSchema = z
  .object({
    id: uuidSchema,
    userId: uuidSchema,
    slug: slugSchema,
    sellerType: sellerTypeSchema,
    fullName: z.string().trim().min(1),
    country: z.string().trim().min(1),
    profilePhotoUrl: sellerProfilePhotoUrlSchema,
    socialLink: z.string().url(),
    shortDescription: z.string().trim().min(1),
    handoffContactType: handoffContactTypeSchema,
    handoffContactValue: z.string().trim().min(1),
    handoffInitiator: handoffInitiatorSchema,
    status: sellerStatusSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const publicSellerProfileSchema = sellerProfileSchema.pick({
  slug: true,
  sellerType: true,
  fullName: true,
  profilePhotoUrl: true,
  country: true,
  socialLink: true,
  shortDescription: true,
});

const sellerProfileBaseWriteSchema = z
  .object({
    slug: slugSchema,
    sellerType: sellerTypeSchema,
    fullName: z.string().trim().min(1),
    country: z.string().trim().min(1),
    socialLink: z.string().url(),
    shortDescription: z.string().trim().min(1),
    handoffContactType: handoffContactTypeSchema,
    handoffContactValue: z.string().trim().min(1),
    handoffInitiator: handoffInitiatorSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const contactValue = value.handoffContactValue.trim();

    if (
      value.handoffContactType === 'TELEGRAM' &&
      !telegramHandleSchema.safeParse(contactValue).success
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
      !phoneHandleSchema.safeParse(contactValue).success
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['handoffContactValue'],
        message: 'Phone contact must be in E.164 format',
      });
    }

    if (
      value.handoffContactType === 'INSTAGRAM' &&
      !instagramHandleSchema.safeParse(contactValue).success
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['handoffContactValue'],
        message:
          'Instagram contact must be @username or https://instagram.com/username',
      });
    }
  });

export const sellerProfileCreateRequestSchema = sellerProfileBaseWriteSchema;

export const sellerProfileUpdateRequestSchema = z
  .object({
    slug: slugSchema.optional(),
    sellerType: sellerTypeSchema.optional(),
    fullName: z.string().trim().min(1).optional(),
    country: z.string().trim().min(1).optional(),
    socialLink: z.string().url().optional(),
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
        !telegramHandleSchema.safeParse(contactValue).success
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
        !phoneHandleSchema.safeParse(contactValue).success
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['handoffContactValue'],
          message: 'Phone contact must be in E.164 format',
        });
      }

      if (
        value.handoffContactType === 'INSTAGRAM' &&
        !instagramHandleSchema.safeParse(contactValue).success
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
    sellerProfile: sellerProfileSchema,
  })
  .strict();

export type SellerProfile = z.infer<typeof sellerProfileSchema>;
export type SellerProfileCreateRequest = z.infer<
  typeof sellerProfileCreateRequestSchema
>;
export type SellerProfileUpdateRequest = z.infer<
  typeof sellerProfileUpdateRequestSchema
>;
export type SellerProfileResponse = z.infer<
  typeof sellerProfileResponseSchema
>;

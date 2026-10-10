import { z } from 'zod';

import { userRoleSchema, userStatusSchema } from './enums';
import { isoDateTimeSchema, slugTextSchema, uuidSchema } from './primitives';

export const accountSlugSchema = slugTextSchema('Введите никнейм').max(
  120,
  'Никнейм не длиннее 120 символов',
);

export const newAccountSlugSchema = slugTextSchema('Введите никнейм')
  .min(3, 'Никнейм должен содержать от 3 до 20 символов')
  .max(20, 'Никнейм должен содержать от 3 до 20 символов');

export const userSchema = z
  .object({
    id: uuidSchema,
    email: z.string().email(),
    phone: z.string().trim().min(1).nullable(),
    emailVerifiedAt: isoDateTimeSchema.nullable(),
    phoneVerifiedAt: isoDateTimeSchema.nullable(),
    acceptedRulesVersion: z.string().trim().min(1).nullable(),
    displayName: z.string().trim().min(1).nullable(),
    slug: accountSlugSchema.nullable(),
    role: userRoleSchema,
    status: userStatusSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const emailAddressSchema = z.string().email('Введите корректный email');

export const passwordSchema = z.string().min(8, 'Используйте пароль от 8 символов');

export const turnstileTokenSchema = z.string().min(1).max(2048);

export const registerRequestSchema = z
  .object({
    email: emailAddressSchema,
    password: passwordSchema,
    phone: z.string().trim().min(1).nullable().optional(),
    slug: newAccountSlugSchema,
    turnstileToken: turnstileTokenSchema,
  })
  .strict();

export const claimSlugRequestSchema = z
  .object({
    slug: newAccountSlugSchema,
  })
  .strict();

export const claimSlugResponseSchema = z
  .object({
    slug: accountSlugSchema,
  })
  .strict();

export const slugAvailabilityResponseSchema = z
  .object({
    available: z.boolean(),
  })
  .strict();

export type SlugAvailabilityResponse = z.infer<typeof slugAvailabilityResponseSchema>;

export const loginRequestSchema = z
  .object({
    email: emailAddressSchema,
    password: z.string().min(1, 'Введите пароль'),
    turnstileToken: turnstileTokenSchema.optional(),
  })
  .strict();

export const meResponseSchema = z
  .object({
    user: userSchema,
  })
  .strict();

export type User = z.infer<typeof userSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type ClaimSlugRequest = z.infer<typeof claimSlugRequestSchema>;
export type ClaimSlugResponse = z.infer<typeof claimSlugResponseSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;

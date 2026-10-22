import { z } from 'zod';

import { userRoleSchema } from './enums';
import { isoDateTimeSchema, uuidSchema } from './primitives';
import {
  emailAddressSchema,
  passwordSchema,
  turnstileTokenSchema,
  userSchema,
  newAccountSlugSchema,
} from './user';
import { registrationLegalSchema } from './legal';

export const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9:_-]{8,80}$/);

export const authResponseSchema = z
  .object({
    user: userSchema,
  })
  .strict();

export const authPrincipalSchema = z
  .object({
    sub: uuidSchema,
    email: z.string().email(),
    role: userRoleSchema,
    sessionVersion: z.number().int().nonnegative(),
  })
  .strict();

export type AuthResponse = z.infer<typeof authResponseSchema>;
export type AuthPrincipal = z.infer<typeof authPrincipalSchema>;

export const emailOtpRequestSchema = z
  .object({
    idempotencyKey: idempotencyKeySchema,
    turnstileToken: turnstileTokenSchema,
  })
  .strict();

/** `accepted` means SMTP accepted the message. `already_verified` means no message was sent. */
export const emailOtpRequestResponseSchema = z
  .object({
    ok: z.literal(true),
    delivery: z.enum(['accepted', 'unknown', 'already_verified']),
  })
  .strict();

export const emailOtpVerifyRequestSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, 'Введите шестизначный код'),
    idempotencyKey: idempotencyKeySchema,
  })
  .strict();

export const emailVerificationStateSchema = z
  .object({
    serverNow: isoDateTimeSchema,
    email: z.string().email(),
    verified: z.boolean(),
    sendStatus: z.enum(['none', 'accepted', 'unknown', 'rejected']),
    codeExpiresAt: isoDateTimeSchema.nullable(),
    resendAvailableAt: isoDateTimeSchema.nullable(),
    pausedUntil: isoDateTimeSchema.nullable(),
    quotaResetsAt: isoDateTimeSchema.nullable(),
  })
  .strict();

export const changeUnverifiedEmailRequestSchema = z
  .object({
    email: emailAddressSchema,
  })
  .strict();

export const forgotPasswordRequestSchema = z
  .object({
    email: emailAddressSchema.transform((value) => value.trim().toLowerCase()),
    idempotencyKey: idempotencyKeySchema,
    turnstileToken: turnstileTokenSchema,
  })
  .strict();

export const resetPasswordRequestSchema = z
  .object({
    token: z.string().trim().min(1),
    password: passwordSchema,
  })
  .strict();

export type EmailOtpRequest = z.infer<typeof emailOtpRequestSchema>;
export type EmailOtpRequestResponse = z.infer<
  typeof emailOtpRequestResponseSchema
>;
export type EmailOtpVerifyRequest = z.infer<typeof emailOtpVerifyRequestSchema>;
export type EmailVerificationState = z.infer<
  typeof emailVerificationStateSchema
>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const authProviderSchema = z.enum(['google', 'telegram']);
export type AuthProvider = z.infer<typeof authProviderSchema>;
export const authOptionsSchema = z
  .object({
    google: z.boolean(),
    telegram: z.boolean(),
    emailCode: z.boolean(),
  })
  .strict();
export const providerStartSchema = z
  .object({
    intent: z.enum(['login', 'link']),
    returnPath: z.string().max(2048).default('/'),
  })
  .strict();
export const providerStartResponseSchema = z
  .object({ url: z.string().url() })
  .strict();
export const authConnectionsSchema = z
  .object({
    connections: z.array(z.object({ provider: authProviderSchema }).strict()),
  })
  .strict();
export const onboardingRequestSchema = z
  .object({
    email: emailAddressSchema,
    slug: newAccountSlugSchema,
    legal: registrationLegalSchema,
    turnstileToken: turnstileTokenSchema,
  })
  .strict();
export const onboardingStateSchema = z
  .object({
    stage: z.enum(['profile', 'email', 'ready']),
    email: z.string().email().nullable(),
    provider: authProviderSchema,
    returnPath: z.string(),
  })
  .strict();
export const onboardingResultSchema = z.union([
  z.object({ next: z.literal('email') }).strict(),
  z
    .object({
      next: z.literal('authenticated'),
      user: userSchema,
      returnPath: z.string(),
    })
    .strict(),
]);
export const emailLoginRequestSchema = z
  .object({
    email: emailAddressSchema,
    idempotencyKey: idempotencyKeySchema,
    turnstileToken: turnstileTokenSchema,
  })
  .strict();
export const emailLoginRequestResponseSchema = z
  .object({ ok: z.literal(true), serverNow: isoDateTimeSchema, resendAvailableAt: isoDateTimeSchema })
  .strict();
export type OnboardingRequest = z.infer<typeof onboardingRequestSchema>;
export type EmailLoginRequest = z.infer<typeof emailLoginRequestSchema>;

export const emailLoginStateSchema = z
  .object({
    email: emailAddressSchema,
    serverNow: isoDateTimeSchema,
    resendAvailableAt: isoDateTimeSchema.nullable(),
    codeExpiresAt: isoDateTimeSchema.nullable(),
  })
  .strict();

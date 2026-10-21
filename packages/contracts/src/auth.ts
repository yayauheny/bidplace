import { z } from 'zod';

import { userRoleSchema } from './enums';
import { isoDateTimeSchema, uuidSchema } from './primitives';
import {
  emailAddressSchema,
  passwordSchema,
  turnstileTokenSchema,
  userSchema,
} from './user';

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

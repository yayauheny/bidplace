import { z } from 'zod';

import { userRoleSchema } from './enums';
import { uuidSchema } from './primitives';
import { passwordSchema, userSchema } from './user';

export const authResponseSchema = z
  .object({
    user: userSchema,
  })
  .strict();

export const authTokenPayloadSchema = z
  .object({
    sub: uuidSchema,
    email: z.string().email(),
    role: userRoleSchema,
    sessionVersion: z.number().int().nonnegative(),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
  })
  .strict();

export type AuthResponse = z.infer<typeof authResponseSchema>;
export type AuthTokenPayload = z.infer<typeof authTokenPayloadSchema>;

export const emailOtpVerifyRequestSchema = z
  .object({ code: z.string().regex(/^\d{6}$/) })
  .strict();

export const forgotPasswordRequestSchema = z
  .object({
    email: z.string().email().transform((value) => value.trim().toLowerCase()),
  })
  .strict();

export const resetPasswordRequestSchema = z
  .object({
    token: z.string().trim().min(1),
    password: passwordSchema,
  })
  .strict();

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

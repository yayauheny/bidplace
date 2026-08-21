import { z } from 'zod';

import { userRoleSchema, userStatusSchema } from './enums';
import { isoDateTimeSchema, uuidSchema } from './primitives';

export const userSchema = z
  .object({
    id: uuidSchema,
    email: z.string().email(),
    phone: z.string().trim().min(1).nullable(),
    emailVerifiedAt: isoDateTimeSchema.nullable(),
    phoneVerifiedAt: isoDateTimeSchema.nullable(),
    acceptedRulesVersion: z.string().trim().min(1).nullable(),
    displayName: z.string().trim().min(1),
    role: userRoleSchema,
    status: userStatusSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const passwordSchema = z.string().min(8);

export const registerRequestSchema = z
  .object({
    email: z.string().email(),
    password: passwordSchema,
    phone: z.string().trim().min(1).nullable().optional(),
    displayName: z.string().trim().min(1),
  })
  .strict();

export const loginRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();

export const meResponseSchema = z
  .object({
    user: userSchema,
  })
  .strict();

export type User = z.infer<typeof userSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;

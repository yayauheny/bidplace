import { z } from 'zod';

import { userRoleSchema } from './enums';
import { uuidSchema } from './primitives';
import { userSchema } from './user';

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

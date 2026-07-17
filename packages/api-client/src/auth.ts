import {
  authResponseSchema,
  loginRequestSchema,
  registerRequestSchema,
  meResponseSchema,
  type LoginRequest,
  type RegisterRequest,
} from '@bidplace/contracts';
import { z } from 'zod';

import { requestJson, type RequestContext } from './request';

const logoutResponseSchema = z.object({
  ok: z.literal(true),
});

export function createAuthClient(context: RequestContext) {
  return {
    register(input: RegisterRequest) {
      return requestJson(
        context,
        '/api/auth/register',
        authResponseSchema,
        {
          method: 'POST',
          body: registerRequestSchema.parse(input),
        },
      );
    },
    login(input: LoginRequest) {
      return requestJson(
        context,
        '/api/auth/login',
        authResponseSchema,
        {
          method: 'POST',
          body: loginRequestSchema.parse(input),
        },
      );
    },
    me() {
      return requestJson(context, '/api/auth/me', meResponseSchema);
    },
    logout() {
      return requestJson(context, '/api/auth/logout', logoutResponseSchema, {
        method: 'POST',
      });
    },
  };
}

import {
  authResponseSchema,
  loginRequestSchema,
  registerRequestSchema,
  meResponseSchema,
  phoneOtpVerifyRequestSchema,
  type LoginRequest,
  type RegisterRequest,
} from '@bidplace/contracts';
import { z } from 'zod';

import { requestJson, type RequestContext } from './request';

const logoutResponseSchema = z.object({
  ok: z.literal(true),
});
const okResponseSchema = z.object({ ok: z.literal(true) });

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
    requestPhoneOtp() {
      return requestJson(context, '/api/auth/phone/request', okResponseSchema, { method: 'POST' });
    },
    verifyPhoneOtp(input: { code: string }) {
      return requestJson(context, '/api/auth/phone/verify', okResponseSchema, { method: 'POST', body: phoneOtpVerifyRequestSchema.parse(input) });
    },
  };
}

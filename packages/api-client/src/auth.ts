import {
  acceptRulesRequestSchema,
  authResponseSchema,
  emailOtpVerifyRequestSchema,
  loginRequestSchema,
  meResponseSchema,
  registerRequestSchema,
  serviceRulesResponseSchema,
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
      return requestJson(context, '/api/auth/register', authResponseSchema, {
        method: 'POST',
        body: registerRequestSchema.parse(input),
      });
    },
    login(input: LoginRequest) {
      return requestJson(context, '/api/auth/login', authResponseSchema, {
        method: 'POST',
        body: loginRequestSchema.parse(input),
      });
    },
    me() {
      return requestJson(context, '/api/auth/me', meResponseSchema);
    },
    getRules() {
      return requestJson(context, '/api/auth/rules', serviceRulesResponseSchema);
    },
    acceptRules(input: { rulesVersion: string }) {
      return requestJson(context, '/api/auth/rules/accept', authResponseSchema, {
        method: 'POST',
        body: acceptRulesRequestSchema.parse(input),
      });
    },
    logout() {
      return requestJson(context, '/api/auth/logout', logoutResponseSchema, {
        method: 'POST',
      });
    },
    requestEmailVerification() {
      return requestJson(context, '/api/auth/email/request', okResponseSchema, {
        method: 'POST',
      });
    },
    verifyEmailVerification(input: { code: string }) {
      return requestJson(context, '/api/auth/email/verify', okResponseSchema, {
        method: 'POST',
        body: emailOtpVerifyRequestSchema.parse(input),
      });
    },
  };
}

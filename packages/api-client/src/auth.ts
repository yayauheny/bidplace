import {
  acceptRulesRequestSchema,
  acceptRulesResponseSchema,
  authResponseSchema,
  emailOtpVerifyRequestSchema,
  forgotPasswordRequestSchema,
  loginRequestSchema,
  meResponseSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
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
      return requestJson(
        context,
        '/api/auth/rules',
        serviceRulesResponseSchema,
      );
    },
    acceptRules(input: { rulesVersion: string }) {
      return requestJson(
        context,
        '/api/auth/rules/accept',
        acceptRulesResponseSchema,
        {
          method: 'POST',
          body: acceptRulesRequestSchema.parse(input),
        },
      );
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
    forgotPassword(input: { email: string }) {
      return requestJson(
        context,
        '/api/auth/password/forgot',
        okResponseSchema,
        {
          method: 'POST',
          body: forgotPasswordRequestSchema.parse(input),
        },
      );
    },
    resetPassword(input: { token: string; password: string }) {
      return requestJson(
        context,
        '/api/auth/password/reset',
        okResponseSchema,
        {
          method: 'POST',
          body: resetPasswordRequestSchema.parse(input),
        },
      );
    },
  };
}

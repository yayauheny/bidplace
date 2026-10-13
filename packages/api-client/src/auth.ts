import {
  acceptRulesRequestSchema,
  acceptRulesResponseSchema,
  newAccountSlugSchema,
  claimSlugRequestSchema,
  claimSlugResponseSchema,
  slugAvailabilityResponseSchema,
  authResponseSchema,
  changeUnverifiedEmailRequestSchema,
  emailOtpRequestResponseSchema,
  emailOtpRequestSchema,
  emailOtpVerifyRequestSchema,
  emailVerificationStateSchema,
  forgotPasswordRequestSchema,
  loginRequestSchema,
  meResponseSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
  serviceRulesResponseSchema,
  legalDocumentsResponseSchema,
  type EmailOtpRequest,
  type EmailOtpVerifyRequest,
  type ForgotPasswordRequest,
  type LoginRequest,
  type RegisterRequest,
} from '@bidplace/contracts';
import { z } from 'zod';

import { parseRequest } from './errors/parse-request';
import { requestJson, signalRequestOptions, type ReadCallOptions, type RequestContext } from './request';

const logoutResponseSchema = z.object({
  ok: z.literal(true),
});
const okResponseSchema = z.object({ ok: z.literal(true) });

export function createAuthClient(context: RequestContext) {
  return {
    register(input: RegisterRequest, options?: ReadCallOptions) {
      return requestJson(context, '/api/auth/register', authResponseSchema, {
        method: 'POST',
        body: parseRequest(registerRequestSchema, input),
        ...signalRequestOptions(options),
      });
    },
    login(input: LoginRequest, options?: ReadCallOptions) {
      return requestJson(context, '/api/auth/login', authResponseSchema, {
        method: 'POST',
        body: parseRequest(loginRequestSchema, input),
        ...signalRequestOptions(options),
      });
    },
    me(options?: ReadCallOptions) {
      return requestJson(context, '/api/auth/me', meResponseSchema, signalRequestOptions(options));
    },
    async slugAvailability(slug: string) {
      const parsed = parseRequest(newAccountSlugSchema, slug);
      return requestJson(
        context,
        `/api/auth/slug-availability?slug=${encodeURIComponent(parsed)}`,
        slugAvailabilityResponseSchema,
      );
    },
    claimSlug(input: { slug: string }) {
      return requestJson(context, '/api/auth/slug', claimSlugResponseSchema, {
        method: 'POST',
        body: parseRequest(claimSlugRequestSchema, input),
      });
    },
    getLegalDocuments(options?: ReadCallOptions) {
      return requestJson(context, '/api/auth/legal', legalDocumentsResponseSchema, signalRequestOptions(options));
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
    logout(options?: ReadCallOptions) {
      return requestJson(context, '/api/auth/logout', logoutResponseSchema, {
        method: 'POST',
        ...signalRequestOptions(options),
      });
    },
    requestEmailVerification(input: EmailOtpRequest, options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/email/request',
        emailOtpRequestResponseSchema,
        {
          method: 'POST',
          body: parseRequest(emailOtpRequestSchema, input),
          ...signalRequestOptions(options),
        },
      );
    },
    emailVerificationState(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/email/state',
        emailVerificationStateSchema,
        signalRequestOptions(options),
      );
    },
    changeUnverifiedEmail(input: { email: string }, options?: ReadCallOptions) {
      return requestJson(context, '/api/auth/email/address', meResponseSchema, {
        method: 'POST',
        body: parseRequest(changeUnverifiedEmailRequestSchema, input),
        ...signalRequestOptions(options),
      });
    },
    verifyEmailVerification(input: EmailOtpVerifyRequest, options?: ReadCallOptions) {
      return requestJson(context, '/api/auth/email/verify', okResponseSchema, {
        method: 'POST',
        body: parseRequest(emailOtpVerifyRequestSchema, input),
        ...signalRequestOptions(options),
      });
    },
    forgotPassword(input: ForgotPasswordRequest, options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/password/forgot',
        okResponseSchema,
        {
          method: 'POST',
          body: parseRequest(forgotPasswordRequestSchema, input),
          ...signalRequestOptions(options),
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
          body: parseRequest(resetPasswordRequestSchema, input),
        },
      );
    },
  };
}

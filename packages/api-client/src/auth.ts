import {
  emailLoginStateSchema,
  authOptionsSchema,
  authConnectionsSchema,
  authProviderSchema,
  providerStartSchema,
  providerStartResponseSchema,
  onboardingRequestSchema,
  onboardingStateSchema,
  onboardingResultSchema,
  emailLoginRequestSchema,
  emailLoginRequestResponseSchema,
  type AuthProvider,
  type OnboardingRequest,
  type EmailLoginRequest,
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
import {
  requestJson,
  signalRequestOptions,
  type ReadCallOptions,
  type RequestContext,
} from './request';

const logoutResponseSchema = z.object({
  ok: z.literal(true),
});
const okResponseSchema = z.object({ ok: z.literal(true) });

export function createAuthClient(context: RequestContext) {
  return {
    options(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/options',
        authOptionsSchema,
        signalRequestOptions(options),
      );
    },
    connections(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/connections',
        authConnectionsSchema,
        signalRequestOptions(options),
      );
    },
    startProvider(
      provider: AuthProvider,
      input: { intent: 'login' | 'link'; returnPath: string },
      options?: ReadCallOptions,
    ) {
      return requestJson(
        context,
        `/api/auth/providers/${parseRequest(authProviderSchema, provider)}/start`,
        providerStartResponseSchema,
        {
          method: 'POST',
          body: parseRequest(providerStartSchema, input),
          ...signalRequestOptions(options),
        },
      );
    },
    onboarding(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/onboarding',
        onboardingStateSchema,
        signalRequestOptions(options),
      );
    },
    resumeOnboarding(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/onboarding/resume',
        onboardingResultSchema,
        { method: 'POST', ...signalRequestOptions(options) },
      );
    },
    completeOnboarding(input: OnboardingRequest, options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/onboarding',
        onboardingResultSchema,
        {
          method: 'POST',
          body: parseRequest(onboardingRequestSchema, input),
          ...signalRequestOptions(options),
        },
      );
    },
    cancelOnboarding(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/onboarding/cancel',
        okResponseSchema,
        { method: 'POST', ...signalRequestOptions(options) },
      );
    },
    onboardingEmailState(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/onboarding/email/state',
        emailVerificationStateSchema,
        signalRequestOptions(options),
      );
    },
    requestOnboardingEmail(input: EmailOtpRequest, options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/onboarding/email/request',
        emailOtpRequestResponseSchema,
        {
          method: 'POST',
          body: parseRequest(emailOtpRequestSchema, input),
          ...signalRequestOptions(options),
        },
      );
    },
    verifyOnboardingEmail(
      input: EmailOtpVerifyRequest,
      options?: ReadCallOptions,
    ) {
      return requestJson(
        context,
        '/api/auth/onboarding/email/verify',
        onboardingResultSchema,
        {
          method: 'POST',
          body: parseRequest(emailOtpVerifyRequestSchema, input),
          ...signalRequestOptions(options),
        },
      );
    },
    loginCodeState(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/email-login/state',
        emailLoginStateSchema,
        signalRequestOptions(options),
      );
    },
    requestLoginCode(input: EmailLoginRequest, options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/email-login/request',
        emailLoginRequestResponseSchema,
        {
          method: 'POST',
          body: parseRequest(emailLoginRequestSchema, input),
          ...signalRequestOptions(options),
        },
      );
    },
    verifyLoginCode(input: EmailOtpVerifyRequest, options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/auth/email-login/verify',
        authResponseSchema,
        {
          method: 'POST',
          body: parseRequest(emailOtpVerifyRequestSchema, input),
          ...signalRequestOptions(options),
        },
      );
    },
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
      return requestJson(
        context,
        '/api/auth/me',
        meResponseSchema,
        signalRequestOptions(options),
      );
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
      return requestJson(
        context,
        '/api/auth/legal',
        legalDocumentsResponseSchema,
        signalRequestOptions(options),
      );
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
    requestEmailVerification(
      input: EmailOtpRequest,
      options?: ReadCallOptions,
    ) {
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
    verifyEmailVerification(
      input: EmailOtpVerifyRequest,
      options?: ReadCallOptions,
    ) {
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

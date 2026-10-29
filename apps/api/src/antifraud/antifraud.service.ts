import { Injectable } from '@nestjs/common';

import { FraudSignalsService } from './signals/fraud-signals.service';

import { RateLimitService } from './rate-limit/rate-limit.service';
import { AuthAbuseService } from './auth/auth-abuse.service';
import { lockAbuseUser, otpCodeHash } from './auth/auth-abuse.store';
import { classifyMailFailure } from './auth/mail-outcome';

@Injectable()
export class AntifraudService {
  constructor(
    private readonly auth: AuthAbuseService,
    private readonly rateLimits: RateLimitService,
    private readonly signals: FraudSignalsService,
  ) {}

  recordSignal(...args: Parameters<FraudSignalsService['recordSignal']>) {
    return this.signals.recordSignal(...args);
  }
  assertCanAct(...args: Parameters<FraudSignalsService['assertCanAct']>) {
    return this.signals.assertCanAct(...args);
  }
  releaseHold(...args: Parameters<FraudSignalsService['releaseHold']>) {
    return this.signals.releaseHold(...args);
  }
  banUser(...args: Parameters<FraudSignalsService['banUser']>) {
    return this.signals.banUser(...args);
  }
  updateUserStatus(
    ...args: Parameters<FraudSignalsService['updateUserStatus']>
  ) {
    return this.signals.updateUserStatus(...args);
  }

  verifyRequired(...args: Parameters<AuthAbuseService['verifyRequired']>) {
    return this.auth.verifyRequired(...args);
  }

  verifySignal(...args: Parameters<AuthAbuseService['verifySignal']>) {
    return this.auth.verifySignal(...args);
  }

  consumeRateLimit(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<boolean> {
    return this.rateLimits.consume(key, limit, windowMs);
  }

  lockAbuseUser(...args: Parameters<typeof lockAbuseUser>) {
    return lockAbuseUser(...args);
  }

  otpCodeHash(...args: Parameters<typeof otpCodeHash>) {
    return otpCodeHash(...args);
  }

  classifyMailFailure(error: unknown) {
    return classifyMailFailure(error);
  }

  isDisposable(...args: Parameters<AuthAbuseService['isDisposable']>) {
    return this.auth.isDisposable(...args);
  }

  assertRegistration(
    ...args: Parameters<AuthAbuseService['assertRegistration']>
  ) {
    return this.auth.assertRegistration(...args);
  }

  assertOnboardingEmailProof(
    ...args: Parameters<AuthAbuseService['assertOnboardingEmailProof']>
  ) {
    return this.auth.assertOnboardingEmailProof(...args);
  }

  assertRegistrationEmail(
    ...args: Parameters<AuthAbuseService['assertRegistrationEmail']>
  ) {
    return this.auth.assertRegistrationEmail(...args);
  }

  assessLogin(...args: Parameters<AuthAbuseService['assessLogin']>) {
    return this.auth.assessLogin(...args);
  }

  sendEmailVerification(
    ...args: Parameters<AuthAbuseService['sendEmailVerification']>
  ) {
    return this.auth.sendEmailVerification(...args);
  }

  sendEmailLogin(...args: Parameters<AuthAbuseService['sendEmailLogin']>) {
    return this.auth.sendEmailLogin(...args);
  }

  readEmailLoginState(
    ...args: Parameters<AuthAbuseService['readEmailLoginState']>
  ) {
    return this.auth.readEmailLoginState(...args);
  }

  verifyEmailCode(...args: Parameters<AuthAbuseService['verifyEmailCode']>) {
    return this.auth.verifyEmailCode(...args);
  }

  readVerificationState(
    ...args: Parameters<AuthAbuseService['readVerificationState']>
  ) {
    return this.auth.readVerificationState(...args);
  }

  correctEmail(...args: Parameters<AuthAbuseService['correctEmail']>) {
    return this.auth.correctEmail(...args);
  }

  sendPasswordReset(
    ...args: Parameters<AuthAbuseService['sendPasswordReset']>
  ) {
    return this.auth.sendPasswordReset(...args);
  }
}

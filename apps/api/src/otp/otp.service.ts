import { ApiErrorCode } from '@bidplace/contracts';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';

import { AuthAbuseService, type MailDelivery } from '../auth-abuse/auth-abuse.service';
import { resolveClientIp, type ClientIpRequest } from '../auth-abuse/client-ip';
import { SERVER_ENV, type ServerEnv } from '../core/config';
import { AppException } from '../core/errors';
import { RateLimitService } from '../core/rate-limit';

export type OtpRequestContext = ClientIpRequest & {
  idempotencyKey: string;
  turnstileToken: string;
};

export type OtpVerifyContext = ClientIpRequest & {
  idempotencyKey: string;
};

@Injectable()
export class OtpService {
  constructor(
    private readonly rateLimits: RateLimitService,
    private readonly abuse: AuthAbuseService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  async request(userId: string, context: OtpRequestContext): Promise<{ delivery: MailDelivery }> {
    const ip = resolveClientIp(context, this.env.TRUST_PROXY);
    if (!this.rateLimits.consume(`email-otp:request:ip:${ip}`, 10, 60_000)) {
      throw new AppException({
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ApiErrorCode.RATE_LIMITED,
        message: 'Too many requests',
      });
    }

    return this.abuse.sendEmailVerification({
      userId,
      idempotencyKey: context.idempotencyKey,
      turnstileToken: context.turnstileToken,
      ip,
    });
  }

  async verify(userId: string, code: string, context: OtpVerifyContext): Promise<void> {
    const ip = resolveClientIp(context, this.env.TRUST_PROXY);
    if (!this.rateLimits.consume(`email-otp:verify:ip:${ip}`, 20, 60_000)) {
      throw new AppException({
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ApiErrorCode.RATE_LIMITED,
        message: 'Too many requests',
      });
    }

    await this.abuse.verifyEmailCode({
      userId,
      code,
      idempotencyKey: context.idempotencyKey,
    });
  }

  state(userId: string) {
    return this.abuse.readVerificationState(userId);
  }

  changeAddress(userId: string, email: string): Promise<void> {
    return this.abuse.correctEmail({ userId, email });
  }
}

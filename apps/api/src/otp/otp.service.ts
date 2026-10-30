import { ApiErrorCode } from '@bidplace/contracts';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';

import {
  AntifraudService,
  type MailDelivery,
  resolveClientIp,
  type ClientIpRequest,
} from '../antifraud';
import { SERVER_ENV, type ServerEnv } from '../core/config';
import { AppException } from '../core/errors';

export type OtpRequestContext = ClientIpRequest & {
  flowId?: string;
  idempotencyKey: string;
  turnstileToken: string;
};

export type OtpVerifyContext = ClientIpRequest & {
  flowId?: string;
  idempotencyKey: string;
};

@Injectable()
export class OtpService {
  constructor(
    private readonly abuse: AntifraudService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  async request(
    userId: string,
    context: OtpRequestContext,
  ): Promise<{ delivery: MailDelivery }> {
    const ip = resolveClientIp(context, this.env.TRUST_PROXY);
    if (!await this.abuse.consumeRateLimit(`email-otp:request:ip:${ip}`, 10, 60_000)) {
      throw new AppException({
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ApiErrorCode.RATE_LIMITED,
        message: 'Too many requests',
      });
    }

    return this.abuse.sendEmailVerification({
      userId,
      ...(context.flowId ? { flowId: context.flowId } : {}),
      idempotencyKey: context.idempotencyKey,
      turnstileToken: context.turnstileToken,
      ip,
    });
  }

  async verify(
    userId: string,
    code: string,
    context: OtpVerifyContext,
  ): Promise<void> {
    const ip = resolveClientIp(context, this.env.TRUST_PROXY);
    if (!await this.abuse.consumeRateLimit(`email-otp:verify:ip:${ip}`, 20, 60_000)) {
      throw new AppException({
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ApiErrorCode.RATE_LIMITED,
        message: 'Too many requests',
      });
    }

    await this.abuse.verifyEmailCode({
      userId,
      code,
      ...(context.flowId ? { flowId: context.flowId } : {}),
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

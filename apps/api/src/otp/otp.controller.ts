import {
  changeUnverifiedEmailRequestSchema,
  emailOtpRequestResponseSchema,
  emailOtpRequestSchema,
  emailOtpVerifyRequestSchema,
  emailVerificationStateSchema,
  meResponseSchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { AuthService, BearerAuthGuard, CurrentUser } from '../auth';
import { readClientIpContext, type ClientIpRequest } from '../auth-abuse/client-ip';
import { parseBody } from '../core/validation';
import { OtpService } from './otp.service';

@Controller('auth/email')
@UseGuards(BearerAuthGuard)
export class OtpController {
  constructor(
    private readonly otp: OtpService,
    private readonly auth: AuthService,
  ) {}

  @Get('state')
  async state(@CurrentUser() auth: AuthTokenPayload) {
    return emailVerificationStateSchema.parse(await this.otp.state(auth.sub));
  }

  @Post('request')
  async request(
    @CurrentUser() auth: AuthTokenPayload,
    @Req() request: ClientIpRequest,
    @Body() body: unknown,
  ) {
    const parsed = parseBody(emailOtpRequestSchema, body);
    const result = await this.otp.request(auth.sub, {
      ...readClientIpContext(request),
      idempotencyKey: parsed.idempotencyKey,
      turnstileToken: parsed.turnstileToken,
    });
    return emailOtpRequestResponseSchema.parse({ ok: true as const, delivery: result.delivery });
  }

  @Post('verify')
  async verify(
    @CurrentUser() auth: AuthTokenPayload,
    @Req() request: ClientIpRequest,
    @Body() body: unknown,
  ) {
    const parsed = parseBody(emailOtpVerifyRequestSchema, body);
    await this.otp.verify(auth.sub, parsed.code, {
      ...readClientIpContext(request),
      idempotencyKey: parsed.idempotencyKey,
    });
    return { ok: true as const };
  }

  @Post('address')
  async changeAddress(
    @CurrentUser() authUser: AuthTokenPayload,
    @Body() body: unknown,
  ) {
    const parsed = parseBody(changeUnverifiedEmailRequestSchema, body);
    await this.otp.changeAddress(authUser.sub, parsed.email);
    return meResponseSchema.parse({ user: await this.auth.me(authUser.sub) });
  }
}

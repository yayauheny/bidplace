import {
  emailOtpVerifyRequestSchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { parseBody } from '../core/validation';
import { OtpService, type OtpRequestContext } from './otp.service';

@Controller('auth/email')
@UseGuards(BearerAuthGuard)
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  @Post('request')
  request(
    @CurrentUser() auth: AuthTokenPayload,
    @Req() request: OtpRequestContext,
  ) {
    return this.otp.request(auth.sub, request).then(() => ({ ok: true }));
  }

  @Post('verify')
  verify(
    @CurrentUser() auth: AuthTokenPayload,
    @Req() request: OtpRequestContext,
    @Body() body: unknown,
  ) {
    return this.otp
      .verify(auth.sub, parseBody(emailOtpVerifyRequestSchema, body).code, request)
      .then(() => ({ ok: true }));
  }
}

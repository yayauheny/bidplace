import {
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from '@bidplace/contracts';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { parseBody } from '../core/validation';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';
import {
  PasswordResetService,
  type PasswordResetRequestContext,
} from './password-reset.service';

const okResponseSchema = z.object({ ok: z.literal(true) });

@Controller('auth/password')
export class PasswordResetController {
  constructor(private readonly passwordReset: PasswordResetService) {}

  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'auth:password:forgot',
    limit: 5,
    windowMs: 60_000,
    scope: 'ip',
  })
  @Post('forgot')
  async forgot(
    @Body() body: unknown,
    @Req() request: PasswordResetRequestContext,
  ) {
    await this.passwordReset.requestReset(
      parseBody(forgotPasswordRequestSchema, body).email,
      request,
    );

    return okResponseSchema.parse({ ok: true as const });
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'auth:password:reset',
    limit: 10,
    windowMs: 60_000,
    scope: 'ip',
  })
  @Post('reset')
  async reset(
    @Body() body: unknown,
    @Req() request: PasswordResetRequestContext,
  ) {
    const input = parseBody(resetPasswordRequestSchema, body);
    await this.passwordReset.resetPassword(input.token, input.password, request);

    return okResponseSchema.parse({ ok: true as const });
  }
}

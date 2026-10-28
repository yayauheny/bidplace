import {
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from '@bidplace/contracts';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { readClientIpContext, type ClientIpRequest } from '../auth-abuse/client-ip';
import { parseBody } from '../core/validation';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';
import { PasswordResetService } from './password-reset.service';

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
    @Req() request: ClientIpRequest,
  ) {
    const parsed = parseBody(forgotPasswordRequestSchema, body);
    await this.passwordReset.requestReset(parsed.email, {
      ...readClientIpContext(request),
      turnstileToken: parsed.turnstileToken,
      idempotencyKey: parsed.idempotencyKey,
    });

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
    @Req() request: ClientIpRequest,
  ) {
    const input = parseBody(resetPasswordRequestSchema, body);
    await this.passwordReset.resetPassword(input.token, input.password, readClientIpContext(request));

    return okResponseSchema.parse({ ok: true as const });
  }
}

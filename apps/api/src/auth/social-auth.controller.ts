import {
  emailLoginStateSchema,
  authConnectionsSchema,
  authOptionsSchema,
  authProviderSchema,
  authResponseSchema,
  emailLoginRequestResponseSchema,
  emailLoginRequestSchema,
  emailOtpRequestResponseSchema,
  emailOtpRequestSchema,
  emailOtpVerifyRequestSchema,
  emailVerificationStateSchema,
  onboardingRequestSchema,
  onboardingResultSchema,
  onboardingStateSchema,
  providerStartResponseSchema,
  providerStartSchema,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Logger,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { resolveClientIp } from '../auth-abuse/client-ip';
import { SERVER_ENV, type ServerEnv } from '../core/config';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';
import { parseBody } from '../core/validation';
import { AuthFlowService, authFailureRedirect } from './auth-flow.service';
import { OidcProvidersService } from './oidc-providers.service';
import { type SessionRequest } from './session.service';

@Controller('auth')
@UseGuards(RateLimitGuard)
@RateLimit({ keyPrefix: 'auth:flow', limit: 60, windowMs: 60_000, scope: 'ip' })
export class SocialAuthController {
  private readonly logger = new Logger(SocialAuthController.name);
  constructor(
    private readonly flows: AuthFlowService,
    private readonly providers: OidcProvidersService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  @Get('options')
  @Header('Cache-Control', 'no-store')
  options() {
    return authOptionsSchema.parse(this.providers.options());
  }

  @Post('providers/:provider/start')
  async start(
    @Param('provider') provider: unknown,
    @Body() body: unknown,
    @Req() request: SessionRequest,
  ) {
    const input = parseBody(providerStartSchema, body);
    return providerStartResponseSchema.parse(
      await this.flows.start(
        request,
        parseBody(authProviderSchema, provider),
        input.intent,
        input.returnPath,
      ),
    );
  }

  @Get('providers/:provider/callback')
  async callback(
    @Param('provider') provider: unknown,
    @Req() request: SessionRequest,
    @Res() response: Response,
  ) {
    try {
      response.redirect(
        await this.flows.callback(
          request,
          parseBody(authProviderSchema, provider),
        ),
      );
    } catch {
      this.logger.warn('Provider callback rejected');
      response.redirect(authFailureRedirect(request.authReturnPath, 'failed'));
    }
  }

  @Get('connections')
  async connections(@Req() request: SessionRequest) {
    return authConnectionsSchema.parse(await this.flows.connections(request));
  }

  @Get('onboarding')
  async onboarding(@Req() request: SessionRequest) {
    return onboardingStateSchema.parse(await this.flows.state(request));
  }

  @Post('onboarding/resume')
  async resume(@Req() request: SessionRequest) {
    return onboardingResultSchema.parse(await this.flows.resume(request));
  }

  @Post('onboarding')
  async complete(@Body() body: unknown, @Req() request: SessionRequest) {
    return onboardingResultSchema.parse(
      await this.flows.complete(
        request,
        parseBody(onboardingRequestSchema, body),
      ),
    );
  }

  @Get('onboarding/email/state')
  async state(@Req() request: SessionRequest) {
    return emailVerificationStateSchema.parse(
      await this.flows.verificationState(request),
    );
  }

  @Post('onboarding/email/request')
  async requestEmail(@Body() body: unknown, @Req() request: SessionRequest) {
    return emailOtpRequestResponseSchema.parse({
      ok: true,
      ...(await this.flows.requestVerification(
        request,
        parseBody(emailOtpRequestSchema, body),
        resolveClientIp(request, this.env.TRUST_PROXY),
      )),
    });
  }

  @Post('onboarding/email/verify')
  async verifyEmail(@Body() body: unknown, @Req() request: SessionRequest) {
    const input = parseBody(emailOtpVerifyRequestSchema, body);
    return onboardingResultSchema.parse(
      await this.flows.verifyOnboarding(
        request,
        input.code,
      ),
    );
  }

  @Post('onboarding/cancel')
  async cancel(@Req() request: SessionRequest) {
    await this.flows.cancel(request);
    return { ok: true as const };
  }

  @Get('email-login/state')
  async loginCodeState(@Req() request: SessionRequest) {
    return emailLoginStateSchema.parse(
      await this.flows.loginCodeState(request),
    );
  }

  @Post('email-login/request')
  async requestCode(@Body() body: unknown, @Req() request: SessionRequest) {
    return emailLoginRequestResponseSchema.parse(
      await this.flows.requestLoginCode(
        request,
        parseBody(emailLoginRequestSchema, body),
        resolveClientIp(request, this.env.TRUST_PROXY),
      ),
    );
  }

  @Post('email-login/verify')
  async verifyCode(@Body() body: unknown, @Req() request: SessionRequest) {
    const input = parseBody(emailOtpVerifyRequestSchema, body);
    return authResponseSchema.parse(
      await this.flows.verifyLogin(request, input.code, input.idempotencyKey),
    );
  }
}

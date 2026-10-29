import {
  type AuthPrincipal,
  acceptRulesRequestSchema,
  acceptRulesResponseSchema,
  authResponseSchema,
  loginRequestSchema,
  meResponseSchema,
  claimSlugRequestSchema,
  claimSlugResponseSchema,
  newAccountSlugSchema,
  slugAvailabilityResponseSchema,
  registerRequestSchema,
  registrationEmailRequestSchema,
  registrationEmailResponseSchema,
  emailOtpVerifyRequestSchema,
  serviceRulesResponseSchema,
  legalDocumentsResponseSchema,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { SESSION_COOKIE_NAME } from './auth.constants';
import { AuthService } from './auth.service';
import { EmailProofService } from './email-proof.service';
import { SessionService, type SessionRequest } from './session.service';
import { SessionAuthGuard } from './session-auth.guard';
import { LogoutAuthGuard } from './logout-auth.guard';
import { CurrentUser } from './current-user.decorator';
import {
  SERVER_ENV,
  type ServerEnv,
  requiresProductionSecurity,
} from '../core/config';
import { resolveClientIp } from '../antifraud';
import { parseBody } from '../core/validation';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';

type AuthCookieResponse = {
  clearCookie: (
    name: string,
    options: {
      httpOnly: boolean;
      sameSite: 'lax';
      secure: boolean;
      path: string;
    },
  ) => void;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessions: SessionService,
    private readonly emailProof: EmailProofService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  @Header('Cache-Control', 'no-store')
  @Get('legal')
  getLegalDocuments() {
    return legalDocumentsResponseSchema.parse(
      this.authService.getLegalDocuments(),
    );
  }

  @Get('rules')
  async getRules() {
    return serviceRulesResponseSchema.parse(await this.authService.getRules());
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'auth:register',
    limit: 5,
    windowMs: 60_000,
    scope: 'ip',
  })
  @Post('register')
  async register(@Body() body: unknown, @Req() request: SessionRequest) {
    const parsed = parseBody(registerRequestSchema, body);
    await this.emailProof.assertRegistrationReady(request, parsed.email);
    const session = await this.authService.register(
      {
        ...parsed,
        ip: resolveClientIp(request, this.env.TRUST_PROXY),
      },
      request.headers.cookie,
    );
    await this.emailProof.completeRegistration(request);
    await this.sessions.login(request, session.user.id, session.sessionVersion);

    return authResponseSchema.parse({
      user: session.user,
    });
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:register-email', limit: 5, windowMs: 60_000, scope: 'ip' })
  @Post('register/email/request')
  async requestRegistrationEmail(@Body() body: unknown, @Req() request: SessionRequest) {
    const input = parseBody(registrationEmailRequestSchema, body);
    await this.emailProof.startRegistration(request, input.email);
    const { ok, serverNow, resendAvailableAt } = await this.emailProof.request(request, {
        ...input,
        intent: 'register',
        ip: resolveClientIp(request, this.env.TRUST_PROXY),
      });
    return registrationEmailResponseSchema.parse({ ok, serverNow, resendAvailableAt });
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:register-email-verify', limit: 20, windowMs: 60_000, scope: 'ip' })
  @Post('register/email/verify')
  async verifyRegistrationEmail(@Body() body: unknown, @Req() request: SessionRequest) {
    const input = parseBody(emailOtpVerifyRequestSchema, body);
    await this.emailProof.verify(request, input.code);
    return { ok: true as const };
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'auth:login',
    limit: 10,
    windowMs: 60_000,
    scope: 'ip',
  })
  @Post('login')
  async login(@Body() body: unknown, @Req() request: SessionRequest) {
    const parsed = parseBody(loginRequestSchema, body);
    const session = await this.authService.login({
      ...parsed,
      ip: resolveClientIp(request, this.env.TRUST_PROXY),
    });

    await this.sessions.login(request, session.user.id, session.sessionVersion);

    return authResponseSchema.parse({
      user: session.user,
    });
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'auth:slug-availability',
    limit: 30,
    windowMs: 60_000,
    scope: 'ip',
  })
  @Get('slug-availability')
  async slugAvailability(@Query('slug') slug: unknown) {
    const parsed = parseBody(newAccountSlugSchema, slug);
    return slugAvailabilityResponseSchema.parse(
      await this.authService.slugAvailability(parsed),
    );
  }

  @UseGuards(SessionAuthGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'auth:slug',
    limit: 10,
    windowMs: 60_000,
    scope: 'ip',
  })
  @Post('slug')
  async claimSlug(@Body() body: unknown, @CurrentUser() auth?: AuthPrincipal) {
    if (!auth) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const input = parseBody(claimSlugRequestSchema, body);
    return claimSlugResponseSchema.parse(
      await this.authService.claimSlug(auth.sub, input.slug),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Post('rules/accept')
  async acceptRules(
    @Body() body: unknown,
    @CurrentUser() auth?: AuthPrincipal,
  ) {
    if (!auth) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const input = parseBody(acceptRulesRequestSchema, body);

    return acceptRulesResponseSchema.parse(
      await this.authService.acceptRules(auth.sub, input),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('me')
  async me(@CurrentUser() auth?: AuthPrincipal) {
    if (!auth) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    return meResponseSchema.parse({
      user: await this.authService.me(auth.sub),
    });
  }

  @UseGuards(LogoutAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() auth: AuthPrincipal | undefined,
    @Req() request: SessionRequest,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    if (auth) {
      await this.authService.logout(auth.sub);
    }

    await this.sessions.destroy(request);
    this.clearSessionCookie(response);

    return { ok: true } as const;
  }

  private clearSessionCookie(response: AuthCookieResponse): void {
    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: requiresProductionSecurity(this.env),
      path: '/',
    });
  }
}

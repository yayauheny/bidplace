import {
  type AuthTokenPayload,
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
  serviceRulesResponseSchema,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import {
  AUTH_TOKEN_COOKIE_NAME,
  AUTH_TOKEN_TTL_SECONDS,
} from './auth.constants';
import { AuthService } from './auth.service';
import { BearerAuthGuard } from './bearer-auth.guard';
import { LogoutAuthGuard } from './logout-auth.guard';
import { CurrentUser } from './current-user.decorator';
import {
  SERVER_ENV,
  type ServerEnv,
  requiresProductionSecurity,
} from '../core/config';
import { resolveClientIp, type ClientIpRequest } from '../auth-abuse/client-ip';
import { parseBody } from '../core/validation';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';

type AuthCookieResponse = {
  cookie: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: 'lax';
      secure: boolean;
      path: string;
      maxAge: number;
    },
  ) => void;
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
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

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
  async register(
    @Body() body: unknown,
    @Req() request: ClientIpRequest,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    const parsed = parseBody(registerRequestSchema, body);
    const session = await this.authService.register({
      ...parsed,
      ip: resolveClientIp(request, this.env.TRUST_PROXY),
    });

    this.writeSessionCookie(response, session.accessToken);

    return authResponseSchema.parse({
      user: session.user,
    });
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'auth:login',
    limit: 10,
    windowMs: 60_000,
    scope: 'ip',
  })
  @Post('login')
  async login(
    @Body() body: unknown,
    @Req() request: ClientIpRequest,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    const parsed = parseBody(loginRequestSchema, body);
    const session = await this.authService.login({
      ...parsed,
      ip: resolveClientIp(request, this.env.TRUST_PROXY),
    });

    this.writeSessionCookie(response, session.accessToken);

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

  @UseGuards(BearerAuthGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'auth:slug',
    limit: 10,
    windowMs: 60_000,
    scope: 'ip',
  })
  @Post('slug')
  async claimSlug(
    @Body() body: unknown,
    @CurrentUser() auth?: AuthTokenPayload,
  ) {
    if (!auth) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const input = parseBody(claimSlugRequestSchema, body);
    return claimSlugResponseSchema.parse(
      await this.authService.claimSlug(auth.sub, input.slug),
    );
  }

  @UseGuards(BearerAuthGuard)
  @Post('rules/accept')
  async acceptRules(
    @Body() body: unknown,
    @CurrentUser() auth?: AuthTokenPayload,
  ) {
    if (!auth) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const input = parseBody(acceptRulesRequestSchema, body);

    return acceptRulesResponseSchema.parse(
      await this.authService.acceptRules(auth.sub, input),
    );
  }

  @UseGuards(BearerAuthGuard)
  @Get('me')
  async me(@CurrentUser() auth?: AuthTokenPayload) {
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
    @CurrentUser() auth: AuthTokenPayload | undefined,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    if (auth) {
      await this.authService.logout(auth.sub);
    }

    this.clearSessionCookie(response);

    return { ok: true } as const;
  }

  private writeSessionCookie(
    response: AuthCookieResponse,
    accessToken: string,
  ): void {
    response.cookie(AUTH_TOKEN_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: requiresProductionSecurity(this.env),
      path: '/',
      maxAge: AUTH_TOKEN_TTL_SECONDS * 1000,
    });
  }

  private clearSessionCookie(response: AuthCookieResponse): void {
    response.clearCookie(AUTH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: requiresProductionSecurity(this.env),
      path: '/',
    });
  }
}

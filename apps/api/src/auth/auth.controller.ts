import {
  type AuthTokenPayload,
  acceptRulesRequestSchema,
  acceptRulesResponseSchema,
  authResponseSchema,
  loginRequestSchema,
  meResponseSchema,
  registerRequestSchema,
  serviceRulesResponseSchema,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Get,
  Post,
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
import { requiresProductionSecurity } from '../core/config';
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
  constructor(private readonly authService: AuthService) {}

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
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    const session = await this.authService.register(
      parseBody(registerRequestSchema, body),
    );

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
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    const session = await this.authService.login(
      parseBody(loginRequestSchema, body),
    );

    this.writeSessionCookie(response, session.accessToken);

    return authResponseSchema.parse({
      user: session.user,
    });
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
      secure: requiresProductionSecurity(process.env),
      path: '/',
      maxAge: AUTH_TOKEN_TTL_SECONDS * 1000,
    });
  }

  private clearSessionCookie(response: AuthCookieResponse): void {
    response.clearCookie(AUTH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: requiresProductionSecurity(process.env),
      path: '/',
    });
  }
}

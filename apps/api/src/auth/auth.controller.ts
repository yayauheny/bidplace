import {
  type AuthTokenPayload,
  loginRequestSchema,
  meResponseSchema,
  registerRequestSchema,
  authResponseSchema,
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
import { CurrentUser } from './current-user.decorator';
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
  @Get('me')
  async me(@CurrentUser() auth?: AuthTokenPayload) {
    if (!auth) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    return meResponseSchema.parse({
      user: await this.authService.me(auth.sub),
    });
  }

  @UseGuards(BearerAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() auth: AuthTokenPayload | undefined,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    if (!auth) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    await this.authService.logout(auth.sub);
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
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: AUTH_TOKEN_TTL_SECONDS * 1000,
    });
  }

  private clearSessionCookie(response: AuthCookieResponse): void {
    response.clearCookie(AUTH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }
}

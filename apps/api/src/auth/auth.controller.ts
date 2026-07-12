import {
  type AuthTokenPayload,
  loginRequestSchema,
  meResponseSchema,
  registerRequestSchema,
} from '@bidplace/contracts';
import { Body, Controller, Get, Post, UnauthorizedException, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { BearerAuthGuard } from './bearer-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { parseBody } from '../core/validation';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: unknown) {
    return this.authService.register(parseBody(registerRequestSchema, body));
  }

  @Post('login')
  login(@Body() body: unknown) {
    return this.authService.login(parseBody(loginRequestSchema, body));
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
}

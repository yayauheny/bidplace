import type { AuthTokenPayload } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { AUTH_TOKEN_COOKIE_NAME } from './auth.constants';
import { AuthTokenService } from './auth-token.service';
import { extractBearerToken, readCookie } from './auth.helpers';
import { parseUserStatus } from '../core/contracts';
import { PrismaService } from '../core/database';

type LogoutRequest = {
  headers: {
    authorization?: string;
    cookie?: string;
  };
  auth?: AuthTokenPayload;
};

const logoutAuthGuardUserSelect = {
  status: true,
  sessionVersion: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class LogoutAuthGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: Pick<ExecutionContext, 'switchToHttp'>,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<LogoutRequest>();
    const token = this.extractToken(
      request.headers.authorization,
      request.headers.cookie,
    );

    if (!token) {
      return true;
    }

    let auth: AuthTokenPayload;
    try {
      auth = this.authTokenService.verify(token);
    } catch {
      return true;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: auth.sub },
      select: logoutAuthGuardUserSelect,
    });

    if (
      !user ||
      parseUserStatus(user.status, auth.sub) !== 'active' ||
      user.sessionVersion !== auth.sessionVersion
    ) {
      return true;
    }

    request.auth = auth;
    return true;
  }

  private extractToken(
    authorization: string | null | undefined,
    cookieHeader: string | null | undefined,
  ): string | null {
    if (authorization) {
      try {
        return extractBearerToken(authorization);
      } catch {
        return null;
      }
    }

    return readCookie(cookieHeader, AUTH_TOKEN_COOKIE_NAME) ?? null;
  }
}

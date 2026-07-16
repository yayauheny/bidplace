import type { AuthTokenPayload } from '@bidplace/contracts';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AUTH_TOKEN_COOKIE_NAME } from './auth.constants';
import { AuthTokenService } from './auth-token.service';
import { extractBearerToken, readCookie } from './auth.helpers';
import { parseUserStatus } from '../core/contracts';
import { PrismaService } from '../core/database';

type AuthenticatedRequest = {
  headers: {
    authorization?: string;
    cookie?: string;
  };
  auth?: AuthTokenPayload;
};

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: Pick<ExecutionContext, 'switchToHttp'>,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    try {
      const token =
        this.extractToken(request.headers.authorization, request.headers.cookie);
      const auth = this.authTokenService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: {
          id: auth.sub,
        },
        select: {
          status: true,
          sessionVersion: true,
        },
      });

      if (
        !user ||
        parseUserStatus(user.status, auth.sub) !== 'active' ||
        user.sessionVersion !== auth.sessionVersion
      ) {
        throw new UnauthorizedException('User is not active');
      }

      request.auth = auth;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid bearer token');
    }
  }

  private extractToken(
    authorization: string | null | undefined,
    cookieHeader: string | null | undefined,
  ): string {
    if (authorization) {
      return extractBearerToken(authorization);
    }

    const cookieToken = readCookie(cookieHeader, AUTH_TOKEN_COOKIE_NAME);

    if (!cookieToken) {
      throw new Error('Missing auth token');
    }

    return cookieToken;
  }
}

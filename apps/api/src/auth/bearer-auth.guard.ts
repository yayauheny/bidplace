import type { AuthTokenPayload } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AUTH_TOKEN_COOKIE_NAME } from './auth.constants';
import { AuthTokenService } from './auth-token.service';
import { extractBearerToken, readCookie } from './auth.helpers';
import { parseUserRole, parseUserStatus } from '../core/contracts';
import { PrismaService } from '../core/database';

type AuthenticatedRequest = {
  headers: {
    authorization?: string;
    cookie?: string;
  };
  auth?: AuthTokenPayload;
};

const authGuardUserSelect = {
  role: true,
  status: true,
  sessionVersion: true,
} satisfies Prisma.UserSelect;

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

    const auth = (() => {
      try {
        const token =
          this.extractToken(request.headers.authorization, request.headers.cookie);
        return this.authTokenService.verify(token);
      } catch {
        throw new UnauthorizedException('Invalid bearer token');
      }
    })();

    const user = await this.prisma.user.findUnique({
      where: {
        id: auth.sub,
      },
      select: authGuardUserSelect,
    });

    if (
      !user ||
      parseUserStatus(user.status, auth.sub) !== 'active' ||
      user.sessionVersion !== auth.sessionVersion
    ) {
      throw new UnauthorizedException('User is not active');
    }

    request.auth = {
      ...auth,
      role: parseUserRole(user.role, auth.sub),
    };
    return true;
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

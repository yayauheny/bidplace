import type { AuthTokenPayload } from '@bidplace/contracts';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthTokenService } from './auth-token.service';
import { extractBearerToken } from './auth.helpers';
import { PrismaService } from '../core/database';

type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  auth?: AuthTokenPayload;
};

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    try {
      const token = extractBearerToken(request.headers.authorization);
      const auth = this.authTokenService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: {
          id: auth.sub,
        },
        select: {
          status: true,
        },
      });

      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('User is not active');
      }

      request.auth = auth;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid bearer token');
    }
  }
}

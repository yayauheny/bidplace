import type { AuthTokenPayload } from '@bidplace/contracts';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthTokenService } from './auth-token.service';
import { extractBearerToken } from './auth.helpers';

type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  auth?: AuthTokenPayload;
};

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(private readonly authTokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    try {
      const token = extractBearerToken(request.headers.authorization);
      request.auth = this.authTokenService.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid bearer token');
    }
  }
}

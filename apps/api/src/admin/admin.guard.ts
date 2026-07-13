import type { AuthTokenPayload } from '@bidplace/contracts';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

type AuthenticatedRequest = {
  auth?: AuthTokenPayload;
};

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.auth?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionService, type SessionRequest } from './session.service';

@Injectable()
export class LogoutAuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}
  async canActivate(
    context: Pick<ExecutionContext, 'switchToHttp'>,
  ): Promise<boolean> {
    try {
      return await this.sessions.authenticate(
        context.switchToHttp().getRequest<SessionRequest>(),
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) return true;
      throw error;
    }
  }
}

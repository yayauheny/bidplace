import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SessionService, type SessionRequest } from './session.service';

@Injectable()
export class OptionalSessionAuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}
  canActivate(
    context: Pick<ExecutionContext, 'switchToHttp'>,
  ): Promise<boolean> {
    return this.sessions.authenticate(
      context.switchToHttp().getRequest<SessionRequest>(),
      true,
    );
  }
}

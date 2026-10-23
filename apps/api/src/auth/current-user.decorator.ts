import type { AuthPrincipal } from '@bidplace/contracts';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type AuthenticatedRequest = {
  auth?: AuthPrincipal;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal | undefined => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.auth;
  },
);

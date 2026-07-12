import type { AuthTokenPayload } from '@bidplace/contracts';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type AuthenticatedRequest = {
  auth?: AuthTokenPayload;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthTokenPayload | undefined => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.auth;
  },
);

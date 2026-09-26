import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../core/database';

type AuthenticatedRequest = { auth?: { sub: string } };

@Injectable()
export class VerifiedEmailGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.auth?.sub;
    const user = userId
      ? await this.prisma.user.findUnique({
          where: { id: userId },
          select: { emailVerifiedAt: true },
        })
      : null;

    if (!user?.emailVerifiedAt) {
      throw new ForbiddenException('Email verification is required');
    }

    return true;
  }
}

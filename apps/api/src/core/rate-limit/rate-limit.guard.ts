import type { AuthTokenPayload } from '@bidplace/contracts';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  RATE_LIMIT_METADATA_KEY,
  type RateLimitOptions,
} from './rate-limit.decorator';
import { RateLimitService } from './rate-limit.service';

type RateLimitedRequest = {
  auth?: AuthTokenPayload;
  ip?: string;
  params: Record<string, string | undefined>;
  headers: {
    'x-forwarded-for'?: string;
  };
  socket?: {
    remoteAddress?: string;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RateLimitedRequest>();
    const key = this.buildKey(request, options);
    const allowed = this.rateLimitService.consume(
      key,
      options.limit,
      options.windowMs,
    );

    if (!allowed) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private buildKey(request: RateLimitedRequest, options: RateLimitOptions): string {
    const principal =
      options.scope === 'ip'
        ? this.resolveIp(request)
        : request.auth?.sub ?? this.resolveIp(request);

    const resource =
      options.scope === 'user-resource' && options.resourceParam
        ? request.params[options.resourceParam] ?? 'unknown'
        : 'global';

    return `${options.keyPrefix}:${principal}:${resource}`;
  }

  private resolveIp(request: RateLimitedRequest): string {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (forwardedFor) {
      return forwardedFor.split(',')[0]?.trim() || 'unknown';
    }

    return request.ip ?? request.socket?.remoteAddress ?? 'unknown';
  }
}

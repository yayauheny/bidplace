import type { AuthPrincipal } from '@bidplace/contracts';
import {
  CanActivate,
  Inject,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  RATE_LIMIT_METADATA_KEY,
  type RateLimitOptions,
} from './rate-limit.decorator';
import { AntifraudService } from '../antifraud.service';

type RateLimitedRequest = {
  auth?: AuthPrincipal;
  ip?: string;
  params: Record<string, string | undefined>;
  socket?: {
    remoteAddress?: string;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Pick<Reflector, 'getAllAndOverride'>,
    @Inject(AntifraudService) private readonly antifraud: Pick<AntifraudService, 'consumeRateLimit'>,
    @Optional() @Inject('RATE_LIMIT_TRUST_PROXY') trustProxy?: boolean,
  ) {
    this.trustProxy = trustProxy ?? false;
  }

  private readonly trustProxy: boolean;

  async canActivate(
    context: Pick<ExecutionContext, 'getHandler' | 'getClass' | 'switchToHttp'>,
  ): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<
      RateLimitOptions | undefined
    >(RATE_LIMIT_METADATA_KEY, [context.getHandler(), context.getClass()]);

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RateLimitedRequest>();
    const key = this.buildKey(request, options);
    const allowed = await this.antifraud.consumeRateLimit(
      key,
      options.limit,
      options.windowMs,
    );

    if (!allowed) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private buildKey(
    request: RateLimitedRequest,
    options: RateLimitOptions,
  ): string {
    const principal =
      options.scope === 'ip'
        ? this.resolveIp(request)
        : (request.auth?.sub ?? this.resolveIp(request));

    const resource =
      options.scope === 'user-resource' && options.resourceParam
        ? (request.params[options.resourceParam] ?? 'unknown')
        : 'global';

    return `${options.keyPrefix}:${principal}:${resource}`;
  }

  private resolveIp(request: RateLimitedRequest): string {
    if (this.trustProxy) {
      if (request.ip) {
        return request.ip;
      }
    }

    return request.socket?.remoteAddress ?? request.ip ?? 'unknown';
  }
}

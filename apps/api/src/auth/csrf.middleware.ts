import {
  Inject,
  Injectable,
  type NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { SERVER_ENV, type ServerEnv, resolveCorsOrigin } from '../core/config';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(@Inject(SERVER_ENV) private readonly env: ServerEnv) {}
  use(request: Request, response: Response, next: NextFunction): void {
    if (request.originalUrl.startsWith('/api/auth'))
      response.setHeader('Cache-Control', 'no-store');
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();
    const source = request.get('origin') ?? request.get('referer');
    let origin: string | undefined;
    try {
      origin = source ? new URL(source).origin : undefined;
    } catch {
      throw new ForbiddenException('Invalid request origin');
    }
    const allowed = [resolveCorsOrigin(this.env), this.env.API_URL]
      .filter((value): value is string => Boolean(value))
      .map((value) => new URL(value).origin);
    if (
      request.get('x-bidplace-request') !== '1' ||
      !origin ||
      !allowed.includes(origin)
    )
      throw new ForbiddenException('Request origin rejected');
    next();
  }
}

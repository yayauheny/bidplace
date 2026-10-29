import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { SERVER_ENV, type ServerEnv } from '../config';

@Injectable()
export class InternalTickGuard implements CanActivate {
  constructor(@Inject(SERVER_ENV) private readonly env: ServerEnv) {}

  canActivate(context: ExecutionContext): boolean {
    const provided = context
      .switchToHttp()
      .getRequest<Request>()
      .get('X-Internal-Tick');
    const expected = this.env.INTERNAL_TICK_SECRET;
    if (!expected || !provided) throw new NotFoundException();
    const actualBytes = Buffer.from(provided);
    const expectedBytes = Buffer.from(expected);
    if (
      actualBytes.length !== expectedBytes.length ||
      !timingSafeEqual(actualBytes, expectedBytes)
    ) {
      throw new NotFoundException();
    }
    return true;
  }
}

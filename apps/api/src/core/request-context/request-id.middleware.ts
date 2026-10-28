import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

type RequestWithId = {
  requestId?: string;
};

type ResponseWithHeader = {
  setHeader(name: string, value: string): void;
};

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: ResponseWithHeader, next: () => void): void {
    const requestId = randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}

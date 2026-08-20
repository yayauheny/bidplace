import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

type RequestWithId = {
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
};

type ResponseWithHeader = {
  setHeader(name: string, value: string): void;
};

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: ResponseWithHeader, next: () => void): void {
    const headerValue = req.headers['x-request-id'];
    const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const requestId =
      typeof raw === 'string' && raw.trim().length > 0
        ? raw.trim()
        : randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}

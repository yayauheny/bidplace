import { type IncomingMessage } from 'node:http';
import { type ServerOptions } from 'socket.io';
import type { ServerEnv } from '../core/config';

function normalizeOrigin(origin: string | undefined): string | undefined {
  const trimmed = origin?.trim();
  return trimmed ? trimmed : undefined;
}

function getRequestOrigin(request: IncomingMessage): string | undefined {
  const origin = request.headers.origin;
  if (Array.isArray(origin)) {
    return normalizeOrigin(origin[0]);
  }

  return typeof origin === 'string' ? normalizeOrigin(origin) : undefined;
}

export function createOriginPolicy(env: Pick<ServerEnv, 'CORS_ORIGIN'>) {
  const allowedOrigin = normalizeOrigin(env.CORS_ORIGIN);

  return (
    request: IncomingMessage,
    callback: (error: string | null | undefined, success: boolean) => void,
  ): void => {
    const origin = getRequestOrigin(request);

    if (!origin) {
      callback(null, true);
      return;
    }

    if (!allowedOrigin) {
      callback(null, false);
      return;
    }

    callback(null, origin === allowedOrigin);
  };
}

export function createRealtimeSocketOptions(
  env: Pick<ServerEnv, 'CORS_ORIGIN'>,
): Pick<ServerOptions, 'allowRequest' | 'cors'> {
  const allowedOrigin = normalizeOrigin(env.CORS_ORIGIN);

  return {
    cors: {
      origin: allowedOrigin ? [allowedOrigin] : false,
      credentials: false,
    },
    allowRequest: createOriginPolicy(env),
  };
}

type SocketHandshakeLike = {
  address?: string;
  headers: Record<string, string | string[] | undefined>;
};

type SocketLike = {
  handshake: SocketHandshakeLike;
};

function normalizeForwardedHeader(header: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(header) ? header[0] : header;

  if (!raw) {
    return undefined;
  }

  const first = raw.split(',')[0]?.trim();
  return first ? first : undefined;
}

export function resolveSocketIp(socket: SocketLike, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = normalizeForwardedHeader(socket.handshake.headers['x-forwarded-for']);

    if (forwarded) {
      return forwarded;
    }
  }

  const address = socket.handshake.address?.trim();
  return address ? address : 'unknown';
}

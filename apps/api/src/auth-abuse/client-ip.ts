export type ClientIpRequest = {
  ip?: string | undefined;
  socket?: {
    remoteAddress?: string | undefined;
  };
};

export function readClientIpContext(
  request: ClientIpRequest | undefined,
): ClientIpRequest {
  if (!request) return {};
  const ip = request.ip;
  const remoteAddress = request.socket?.remoteAddress;
  return {
    ...(ip !== undefined ? { ip } : {}),
    ...(remoteAddress !== undefined ? { socket: { remoteAddress } } : {}),
  };
}

export function resolveClientIp(
  request: ClientIpRequest | undefined,
  trustProxy: boolean,
): string {
  if (trustProxy && request?.ip) return request.ip;
  return request?.socket?.remoteAddress ?? request?.ip ?? 'unknown';
}

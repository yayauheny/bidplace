import { describe, expect, it, vi } from 'vitest';

import {
  createOriginPolicy,
  createRealtimeSocketOptions,
  resolveSocketIp,
} from './realtime.options';

describe('realtime options', () => {
  it('builds a credential-free allow-listed Socket.IO config', () => {
    const options = createRealtimeSocketOptions({
      CORS_ORIGIN: 'https://app.example.com',
    });

    expect(options.cors).toEqual({
      origin: ['https://app.example.com'],
      credentials: false,
    });
    expect(options.allowRequest).toEqual(expect.any(Function));
  });

  it('rejects browser origins when no CORS origin is configured', () => {
    const allowRequest = createOriginPolicy({ CORS_ORIGIN: undefined });
    const callback = vi.fn();

    allowRequest(
      { headers: { origin: 'https://app.example.com' } } as never,
      callback,
    );

    expect(callback).toHaveBeenCalledWith(null, false);
  });

  it('allows non-browser Socket.IO requests without Origin', () => {
    const allowRequest = createOriginPolicy({ CORS_ORIGIN: undefined });
    const callback = vi.fn();

    allowRequest({ headers: {} } as never, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('uses forwarded IPs only when proxy trust is enabled', () => {
    const socket = {
      handshake: {
        address: '127.0.0.1',
        headers: {
          'x-forwarded-for': '203.0.113.10, 198.51.100.1',
        },
      },
    };

    expect(resolveSocketIp(socket, false)).toBe('127.0.0.1');
    expect(resolveSocketIp(socket, true)).toBe('203.0.113.10');
  });

  it('falls back to unknown when no address is available', () => {
    expect(
      resolveSocketIp(
        { handshake: { headers: {}, address: undefined } } as never,
        false,
      ),
    ).toBe('unknown');
  });
});

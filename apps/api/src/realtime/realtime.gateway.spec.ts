import { randomUUID } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import { RealtimeGateway } from './realtime.gateway';

function createSocket(id = 'socket-1') {
  return {
    id,
    handshake: {
      address: '127.0.0.1',
      headers: {},
    },
    join: vi.fn(),
    disconnect: vi.fn(),
  } as never;
}

describe('RealtimeGateway', () => {
  it('rejects invalid listing join payloads', async () => {
    const gateway = new RealtimeGateway(
      { listing: { findFirst: vi.fn() } } as never,
      { consume: vi.fn().mockReturnValue(true) } as never,
    );

    await expect(gateway.join(createSocket(), { listingId: 'bad-id' })).rejects.toThrow(
      'Invalid listing id',
    );
  });

  it('rejects private listings', async () => {
    const prisma = {
      listing: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const gateway = new RealtimeGateway(
      prisma as never,
      { consume: vi.fn().mockReturnValue(true) } as never,
    );

    await expect(
      gateway.join(createSocket('private-socket'), { listingId: randomUUID() }),
    ).rejects.toThrow('Listing is not public');
  });

  it('enforces socket room limits', async () => {
    const listingIds = [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444',
      '55555555-5555-4555-8555-555555555555',
      '66666666-6666-4666-8666-666666666666',
    ];
    const prisma = {
      listing: {
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id })),
      },
    };
    const rateLimits = {
      consume: vi.fn().mockReturnValue(true),
    };
    const gateway = new RealtimeGateway(prisma as never, rateLimits as never);
    const socket = createSocket();

    await expect(
      gateway.join(socket, { listingId: listingIds[0] }),
    ).resolves.toEqual({ ok: true });

    for (const listingId of listingIds.slice(1, 5)) {
      await expect(
        gateway.join(socket, { listingId }),
      ).resolves.toEqual({ ok: true });
    }

    await expect(
      gateway.join(socket, { listingId: listingIds[5] }),
    ).rejects.toThrow('Too many joined rooms');
  });

  it('disconnects rate-limited connections and clears socket-local room state', async () => {
    const prisma = {
      listing: {
        findFirst: vi.fn().mockResolvedValue({ id: randomUUID() }),
      },
    };
    const rateLimits = {
      consume: vi
        .fn()
        .mockImplementation((key: string) => !key.startsWith('realtime:connect')),
    };
    const gateway = new RealtimeGateway(prisma as never, rateLimits as never);
    const socket = createSocket('socket-2');

    gateway.handleConnection(socket);
    expect(socket.disconnect).toHaveBeenCalledWith(true);

    const joinSocket = createSocket('socket-3');

    for (let index = 0; index < 5; index += 1) {
      await expect(
        gateway.join(joinSocket, { listingId: randomUUID() }),
      ).resolves.toEqual({ ok: true });
    }

    gateway.handleDisconnect(joinSocket);

    await expect(
      gateway.join(joinSocket, { listingId: randomUUID() }),
    ).resolves.toEqual({ ok: true });
  });
});

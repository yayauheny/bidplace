import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WsException,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { type IncomingMessage } from 'node:http';
import { Server, Socket } from 'socket.io';

import { uuidSchema } from '@bidplace/contracts';

import { PrismaService } from '../core/database';
import { RateLimitService } from '../core/rate-limit';

const allowedOrigin = process.env.CORS_ORIGIN?.trim();
const gatewayCorsOrigin = allowedOrigin ? [allowedOrigin] : false;
const publicListingRoomLimit = 5;

function allowSocketRequest(request: IncomingMessage, callback: (error: Error | null, success: boolean) => void): void {
  const origin = request.headers.origin;

  if (!origin) {
    callback(null, true);
    return;
  }

  if (!allowedOrigin) {
    callback(null, false);
    return;
  }

  callback(null, origin === allowedOrigin);
}

function resolveSocketIp(socket: Socket): string {
  const forwardedFor = socket.handshake.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    const firstForwarded = forwardedFor.split(',')[0];

    if (firstForwarded) {
      return firstForwarded.trim();
    }
  }

  if (Array.isArray(forwardedFor)) {
    const firstForwarded = forwardedFor[0];

    if (typeof firstForwarded === 'string' && firstForwarded.trim()) {
      const firstValue = firstForwarded.split(',')[0];

      if (firstValue) {
        return firstValue.trim();
      }
    }
  }

  return socket.handshake.address ?? socket.id;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: gatewayCorsOrigin,
    credentials: false,
  },
  allowRequest: allowSocketRequest,
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  private readonly socketRooms = new Map<string, Set<string>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimits: RateLimitService,
  ) {}

  handleConnection(socket: Socket): void {
    const ip = resolveSocketIp(socket);

    if (!this.rateLimits.consume(`realtime:connect:ip:${ip}`, 30, 60_000)) {
      socket.disconnect(true);
      return;
    }

    this.socketRooms.set(socket.id, new Set());
  }

  handleDisconnect(socket: Socket): void {
    this.socketRooms.delete(socket.id);
  }

  @SubscribeMessage('listing.join')
  async join(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: unknown,
  ): Promise<{ ok: true }> {
    const parsed = uuidSchema.safeParse(
      typeof payload === 'string' ? payload : (payload as { listingId?: unknown })?.listingId,
    );

    if (!parsed.success) {
      throw new WsException('Invalid listing id');
    }

    const ip = resolveSocketIp(socket);

    if (!this.rateLimits.consume(`realtime:join:ip:${ip}`, 60, 60_000)) {
      throw new WsException('Too many join requests');
    }

    const listing = await this.prisma.listing.findFirst({
      where: {
        id: parsed.data,
        status: { in: ['SCHEDULED', 'LIVE'] },
        product: { status: 'APPROVED' },
      },
      select: { id: true },
    });

    if (!listing) {
      throw new WsException('Listing is not public');
    }

    const rooms = this.socketRooms.get(socket.id) ?? new Set<string>();

    if (!rooms.has(listing.id) && rooms.size >= publicListingRoomLimit) {
      throw new WsException('Too many joined rooms');
    }

    rooms.add(listing.id);
    this.socketRooms.set(socket.id, rooms);
    socket.join(`listing:${listing.id}`);

    return { ok: true };
  }

  emit(
    listingId: string,
    event: 'listing.updated' | 'bid.placed' | 'listing.ended',
    payload: object,
  ): void {
    this.server.to(`listing:${listingId}`).emit(event, payload);
  }
}

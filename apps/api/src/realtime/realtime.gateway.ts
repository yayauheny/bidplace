import { Inject, Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WsException,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { uuidSchema } from '@bidplace/contracts';

import { PrismaService } from '../core/database';
import { CommerceCapability } from '../core/commerce';
import { RateLimitService } from '../core/rate-limit';
import { publicListingWhere } from '../products/public-visibility';
import { resolveSocketIp } from './realtime.options';

const publicListingRoomLimit = 5;
const anonymousConnectionLimit = 5;
const anonymousJoinLimit = 10;

@Injectable()
@WebSocketGateway()
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  private readonly socketRooms = new Map<string, Set<string>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimits: RateLimitService,
    private readonly commerce: CommerceCapability,
    @Inject('REALTIME_TRUST_PROXY') private readonly trustProxy: boolean,
  ) {}

  handleConnection(socket: Socket): void {
    if (!this.commerce.isEnabled()) {
      socket.disconnect(true);
      return;
    }

    const ip = resolveSocketIp(socket, this.trustProxy);
    const bucket = ip === 'unknown' ? 'unknown' : ip;
    const limit = ip === 'unknown' ? anonymousConnectionLimit : 30;

    if (
      !this.rateLimits.consume(`realtime:connect:ip:${bucket}`, limit, 60_000)
    ) {
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
    this.commerce.assertEnabled();

    const parsed = uuidSchema.safeParse(
      typeof payload === 'string'
        ? payload
        : (payload as { listingId?: unknown })?.listingId,
    );

    if (!parsed.success) {
      throw new WsException('Invalid listing id');
    }

    const ip = resolveSocketIp(socket, this.trustProxy);
    const bucket = ip === 'unknown' ? 'unknown' : ip;
    const limit = ip === 'unknown' ? anonymousJoinLimit : 60;

    if (!this.rateLimits.consume(`realtime:join:ip:${bucket}`, limit, 60_000)) {
      throw new WsException('Too many join requests');
    }

    const listing = await this.prisma.listing.findFirst({
      where: {
        id: parsed.data,
        ...publicListingWhere(['SCHEDULED', 'LIVE']),
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
    if (!this.commerce.isEnabled()) {
      return;
    }

    this.server.to(`listing:${listingId}`).emit(event, payload);
  }
}

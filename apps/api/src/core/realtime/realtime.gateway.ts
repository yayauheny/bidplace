import {
  type AuctionEndedEventPayload,
  type AuctionUpdatedEventPayload,
  type BidPlacedEventPayload,
  type RealtimeEventName,
} from '@bidplace/contracts';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

function buildAuctionRoom(auctionId: string): string {
  return `auction:${auctionId}`;
}

@WebSocketGateway({
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const auctionId = client.handshake.query.auctionId;

    if (typeof auctionId === 'string' && auctionId.length > 0) {
      void client.join(buildAuctionRoom(auctionId));
    }
  }

  emitToAuction(
    auctionId: string,
    event: RealtimeEventName,
    payload:
      | AuctionUpdatedEventPayload
      | BidPlacedEventPayload
      | AuctionEndedEventPayload,
  ) {
    this.server.to(buildAuctionRoom(auctionId)).emit(event, payload);
  }
}

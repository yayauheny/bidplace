import { type AuctionEndedEventPayload, type AuctionUpdatedEventPayload, type BidPlacedEventPayload, type RealtimeEventName } from '@bidplace/contracts';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  namespace: '/realtime',
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  emit(
    event: RealtimeEventName,
    payload: AuctionUpdatedEventPayload | BidPlacedEventPayload | AuctionEndedEventPayload,
  ) {
    this.server.emit(event, payload);
  }
}

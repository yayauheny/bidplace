import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class RealtimeGateway { @WebSocketServer() server!: Server; @SubscribeMessage('listing.join') join(@ConnectedSocket() socket: Socket, @MessageBody() listingId: string) { socket.join(`listing:${listingId}`); } emit(listingId: string, event: 'listing.updated' | 'bid.placed' | 'listing.ended', payload: object): void { this.server.to(`listing:${listingId}`).emit(event, payload); } }

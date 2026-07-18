import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
@Injectable() export class RealtimeService { constructor(private readonly gateway: RealtimeGateway) {} emit(listingId: string, event: 'listing.updated' | 'bid.placed' | 'listing.ended', payload: object) { this.gateway.emit(listingId, event, payload); } }

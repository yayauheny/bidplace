import {
  type AuctionEndedEventPayload,
  type AuctionUpdatedEventPayload,
  type BidPlacedEventPayload,
  auctionEndedEventPayloadSchema,
  auctionUpdatedEventPayloadSchema,
  bidPlacedEventPayloadSchema,
} from '@bidplace/contracts';
import { Injectable } from '@nestjs/common';

import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeEventsService {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  publishAuctionUpdated(payload: AuctionUpdatedEventPayload) {
    const parsed = auctionUpdatedEventPayloadSchema.parse(payload);

    this.realtimeGateway.emit('auction.updated', parsed);

    return parsed;
  }

  publishBidPlaced(payload: BidPlacedEventPayload) {
    const parsed = bidPlacedEventPayloadSchema.parse(payload);

    this.realtimeGateway.emit('bid.placed', parsed);

    return parsed;
  }

  publishAuctionEnded(payload: AuctionEndedEventPayload) {
    const parsed = auctionEndedEventPayloadSchema.parse(payload);

    this.realtimeGateway.emit('auction.ended', parsed);

    return parsed;
  }
}

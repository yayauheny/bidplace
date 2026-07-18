import {
  type AdminOrderCancellationRequest,
  type AdminOrderReplacementRequest,
  orderResponseSchema,
} from '@bidplace/contracts';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService, runSerializableTransaction } from '../core/database';
import { PublicIdService } from '../core/public-id';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicIds: PublicIdService,
  ) {}

  async get(userId: string, role: string, publicId: string) {
    const order = await this.findWithProduct(publicId);
    if (!order) throw new NotFoundException('Order not found');
    if (role !== 'admin' && order.sellerId !== userId && order.buyerId !== userId) {
      throw new ForbiddenException('Order is not available');
    }

    return this.toResponse(order, role === 'admin' || order.sellerId === userId);
  }

  async listRankedBids(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const bids = await this.prisma.bid.findMany({
      where: { listingId },
      select: { id: true, listingId: true, amount: true, createdAt: true, bidderUserId: true },
      orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });

    return {
      bids: bids.map((bid) => ({
        id: bid.id,
        listingId: bid.listingId,
        amount: bid.amount.toNumber(),
        createdAt: bid.createdAt.toISOString(),
        bidderAlias: `Bidder ${bid.bidderUserId.slice(0, 6)}`,
      })),
    };
  }

  async cancel(publicId: string, input: AdminOrderCancellationRequest) {
    const updated = await this.prisma.order.updateMany({
      where: { publicId, status: 'PENDING_CONTACT' },
      data: { status: 'CANCELLED', cancellationReason: input.reason },
    });
    if (updated.count !== 1) throw new ConflictException('Order cannot be cancelled');
    const response = await this.findWithProduct(publicId);
    if (!response) throw new NotFoundException('Order not found');
    return this.toResponse(response, true);
  }

  async replace(publicId: string, input: AdminOrderReplacementRequest) {
    const replacement = await runSerializableTransaction(this.prisma, async (tx) => {
      const original = await tx.order.findUnique({
        where: { publicId },
        include: { listing: { select: { id: true, status: true } } },
      });
      if (!original || original.status !== 'CANCELLED' || original.listing.status !== 'ENDED') {
        throw new ConflictException('Order is not eligible for replacement');
      }
      const active = await tx.order.findFirst({
        where: { listingId: original.listingId, status: { in: ['PENDING_CONTACT', 'COMPLETED'] } },
        select: { id: true },
      });
      if (active) throw new ConflictException('Listing already has an active Order');
      const bid = await tx.bid.findFirst({
        where: { id: input.bidId, listingId: original.listingId },
      });
      if (!bid) throw new NotFoundException('Bid not found for Listing');

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          return await tx.order.create({
            data: {
              publicId: this.publicIds.generate(),
              listingId: original.listingId,
              sellerId: original.sellerId,
              buyerId: bid.bidderUserId,
              sourceBidId: bid.id,
              finalAmount: bid.amount,
              contactDueAt: new Date(),
            },
          });
        } catch (error) {
          if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002')) {
            throw error;
          }
        }
      }
      throw new ConflictException('Could not assign Order number');
    });
    const response = await this.findWithProduct(replacement.publicId);
    if (!response) throw new NotFoundException('Order not found');
    return this.toResponse(response, true);
  }

  private findWithProduct(publicId: string) {
    return this.prisma.order.findUnique({
      where: { publicId },
      include: { listing: { include: { product: true } }, buyer: { select: { phone: true } } },
    });
  }

  private toResponse(
    order: NonNullable<Awaited<ReturnType<OrdersService['findWithProduct']>>>,
    includeBuyerContact: boolean,
  ) {
    return orderResponseSchema.parse({
      order: {
        id: order.id,
        publicId: order.publicId,
        listingId: order.listingId,
        finalAmount: order.finalAmount.toNumber(),
        contactDueAt: order.contactDueAt.toISOString(),
        status: order.status,
        cancellationReason: order.cancellationReason,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
      productSummary: {
        publicId: order.listing.product.publicId,
        title: order.listing.product.title ?? 'Product',
      },
      buyerPhone: includeBuyerContact ? order.buyer.phone : null,
      buyerTelegramUsername: null,
    });
  }
}

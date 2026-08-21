import {
  type AdminOrderCancellationRequest,
  type AdminOrderReplacementRequest,
  adminOrderResponseSchema,
  buyerOrderResponseSchema,
  sellerOrderResponseSchema,
} from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService, runSerializableTransaction } from '../core/database';
import { PublicIdService } from '../core/public-id';
import {
  createWinnerOrder,
  WINNER_BID_ORDER_BY,
  WinnerOrderPublicIdExhaustedError,
} from './create-winner-order';
import { createOrderSnapshot } from './order-snapshot';
import { createBidderAlias } from '../bids/bid-alias';

const orderWithProductSelect = {
  id: true,
  publicId: true,
  listingId: true,
  sourceBidId: true,
  finalAmount: true,
  contactDueAt: true,
  status: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
  sellerHandoffType: true,
  sellerHandoffValue: true,
  buyerEmailAtClose: true,
  handoffInitiator: true,
  sellerId: true,
  buyerId: true,
  listing: {
    include: {
      product: {
        include: {
          sellerProfile: true,
        },
      },
    },
  },
  buyer: { select: { email: true } },
  seller: { select: { email: true } },
} satisfies Prisma.OrderSelect;

type OrderRecord = Prisma.OrderGetPayload<{
  select: typeof orderWithProductSelect;
}>;

type OrderAudience = 'admin' | 'seller' | 'buyer';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicIds: PublicIdService,
  ) {}

  async get(userId: string, role: string, publicId: string) {
    const order = await this.findWithProduct(publicId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const audience = this.resolveAudience(userId, role, order);

    if (order.status === 'CANCELLED' && audience !== 'admin') {
      throw new ForbiddenException('Order is not available');
    }

    return this.toResponse(order, audience);
  }

  async markContacted(userId: string, role: string, publicId: string) {
    return this.updateSellerStatus(userId, role, publicId, 'CONTACTED', [
      'PENDING_CONTACT',
    ]);
  }

  async markCompleted(userId: string, role: string, publicId: string) {
    return this.updateSellerStatus(userId, role, publicId, 'COMPLETED', [
      'CONTACTED',
    ]);
  }

  async markHandoffFailed(userId: string, role: string, publicId: string) {
    return this.updateSellerStatus(userId, role, publicId, 'HANDOFF_FAILED', [
      'PENDING_CONTACT',
      'CONTACTED',
    ]);
  }

  async listRankedBids(userId: string, role: string, listingId: string) {
    void userId;
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const bids = await this.prisma.bid.findMany({
      where: { listingId },
      select: {
        id: true,
        listingId: true,
        amount: true,
        createdAt: true,
        bidderUserId: true,
      },
      orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });

    return {
      bids: bids.map((bid) => ({
        id: bid.id,
        listingId: bid.listingId,
        amount: bid.amount.toNumber(),
        createdAt: bid.createdAt.toISOString(),
        bidderAlias: createBidderAlias(bid.listingId, bid.bidderUserId),
      })),
    };
  }

  async listEndedWithoutOrder(role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    const listings = await this.prisma.listing.findMany({
      where: {
        status: 'ENDED',
        bidCount: { gt: 0 },
        orders: { none: {} },
      },
      orderBy: [{ closedAt: 'asc' }, { endsAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        productId: true,
        bidCount: true,
        currentPrice: true,
        endsAt: true,
        closedAt: true,
        product: {
          select: {
            publicId: true,
            title: true,
            sellerProfile: {
              select: {
                id: true,
                slug: true,
                handoffContactType: true,
                handoffContactValue: true,
              },
            },
          },
        },
      },
    });

    return {
      listings: listings.map((listing) => ({
        listingId: listing.id,
        productId: listing.productId,
        productPublicId: listing.product.publicId,
        productTitle: listing.product.title,
        sellerProfileId: listing.product.sellerProfile.id,
        sellerSlug: listing.product.sellerProfile.slug,
        bidCount: listing.bidCount,
        currentPrice: listing.currentPrice.toNumber(),
        endsAt: listing.endsAt.toISOString(),
        closedAt: listing.closedAt?.toISOString() ?? null,
        handoffReady: Boolean(
          listing.product.sellerProfile.handoffContactType &&
            listing.product.sellerProfile.handoffContactValue,
        ),
      })),
    };
  }

  async createOrderForEndedListing(
    adminUserId: string,
    role: string,
    listingId: string,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    const prepared = await runSerializableTransaction(
      this.prisma,
      async (tx) => {
        const listing = await tx.listing.findUnique({
          where: { id: listingId },
          include: {
            product: {
              include: {
                sellerProfile: true,
              },
            },
          },
        });

        if (!listing) {
          throw new NotFoundException('Listing not found');
        }

        if (listing.status !== 'ENDED') {
          throw new ConflictException('Listing is not ended');
        }

        const activeOrder = await tx.order.findFirst({
          where: {
            listingId,
            status: { not: 'CANCELLED' },
          },
          orderBy: { createdAt: 'asc' },
        });

        if (activeOrder) {
          return { kind: 'existing' as const, order: activeOrder };
        }

        const anyOrder = await tx.order.findFirst({
          where: { listingId },
          select: { id: true },
        });

        if (anyOrder) {
          throw new ConflictException(
            'Listing already has Order history; use replacement after cancellation',
          );
        }

        const winner = await tx.bid.findFirst({
          where: { listingId },
          orderBy: WINNER_BID_ORDER_BY,
        });

        if (!winner) {
          throw new ConflictException('Order recovery is unavailable');
        }

        const buyer = await tx.user.findUnique({
          where: { id: winner.bidderUserId },
          select: { email: true },
        });

        if (!buyer) {
          throw new NotFoundException('Buyer not found');
        }

        const sellerProfile = listing.product.sellerProfile;
        if (
          !sellerProfile.handoffContactType ||
          !sellerProfile.handoffContactValue
        ) {
          throw new ConflictException('Seller handoff contact is missing');
        }

        return {
          kind: 'create' as const,
          listingId,
          sellerId: sellerProfile.userId,
          buyerId: winner.bidderUserId,
          sourceBidId: winner.id,
          finalAmount: winner.amount,
          sellerHandoffType: sellerProfile.handoffContactType,
          sellerHandoffValue: sellerProfile.handoffContactValue,
          buyerEmailAtClose: buyer.email,
          handoffInitiator: sellerProfile.handoffInitiator,
        };
      },
    );

    const createdOrExisting =
      prepared.kind === 'existing'
        ? prepared.order
        : await (async () => {
            let result;
            try {
              result = await createWinnerOrder(
                this.prisma,
                {
                  listingId: prepared.listingId,
                  sellerId: prepared.sellerId,
                  buyerId: prepared.buyerId,
                  sourceBidId: prepared.sourceBidId,
                  finalAmount: prepared.finalAmount,
                  contactDueAt: new Date(Date.now() + 86_400_000),
                  sellerHandoffType: prepared.sellerHandoffType,
                  sellerHandoffValue: prepared.sellerHandoffValue,
                  buyerEmailAtClose: prepared.buyerEmailAtClose,
                  handoffInitiator: prepared.handoffInitiator,
                  generatePublicId: () => this.publicIds.generate(),
                },
                {
                  onCreated: async (tx, order) => {
                    await this.recordAudit(tx, {
                      actorUserId: adminUserId,
                      targetType: 'ORDER',
                      targetId: order.id,
                      oldStatus: null,
                      newStatus: order.status,
                      reason: `Admin created Order for ended Listing ${listingId} from Bid ${prepared.sourceBidId}`,
                    });
                  },
                },
              );
            } catch (error) {
              if (error instanceof WinnerOrderPublicIdExhaustedError) {
                throw new ConflictException('Could not assign Order number');
              }
              throw error;
            }

            return result.order;
          })();

    const response = await this.findWithProduct(createdOrExisting.publicId);
    if (!response) {
      throw new NotFoundException('Order not found');
    }

    return this.toResponse(response, 'admin');
  }

  async cancel(
    adminUserId: string,
    role: string,
    publicId: string,
    input: AdminOrderCancellationRequest,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    await runSerializableTransaction(this.prisma, async (tx) => {
      const order = await tx.order.findUnique({
        where: { publicId },
        include: { listing: { select: { id: true } } },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (
        !['PENDING_CONTACT', 'CONTACTED', 'HANDOFF_FAILED'].includes(
          order.status,
        )
      ) {
        throw new ConflictException('Order cannot be cancelled');
      }

      await tx.order.update({
        where: { publicId },
        data: {
          status: 'CANCELLED',
          cancellationReason: input.reason,
        },
      });

      await this.recordAudit(tx, {
        actorUserId: adminUserId,
        targetType: 'ORDER',
        targetId: order.id,
        oldStatus: order.status,
        newStatus: 'CANCELLED',
        reason: input.reason,
      });

      return order.id;
    });

    const updated = await this.findWithProduct(publicId);
    if (!updated) {
      throw new NotFoundException('Order not found');
    }

    return this.toResponse(updated, 'admin');
  }

  async replace(
    adminUserId: string,
    role: string,
    publicId: string,
    input: AdminOrderReplacementRequest,
  ) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    const replacement = await runSerializableTransaction(
      this.prisma,
      async (tx) => {
        const original = await tx.order.findUnique({
          where: { publicId },
          include: {
            listing: {
              include: {
                product: {
                  include: {
                    sellerProfile: true,
                  },
                },
              },
            },
          },
        });

        if (!original || original.status !== 'CANCELLED') {
          throw new ConflictException('Order is not eligible for replacement');
        }

        if (input.bidId === original.sourceBidId) {
          throw new ConflictException(
            'Replacement bid must differ from the original source bid',
          );
        }

        const active = await tx.order.findFirst({
          where: {
            listingId: original.listingId,
            status: { in: ['PENDING_CONTACT', 'CONTACTED', 'HANDOFF_FAILED'] },
          },
          select: { id: true },
        });

        if (active) {
          throw new ConflictException('Listing already has an active Order');
        }

        const bid = await tx.bid.findFirst({
          where: { id: input.bidId, listingId: original.listingId },
        });

        if (!bid) {
          throw new NotFoundException('Bid not found for Listing');
        }

        const buyer = await tx.user.findUnique({
          where: { id: bid.bidderUserId },
          select: { email: true },
        });

        if (!buyer) {
          throw new NotFoundException('Buyer not found');
        }

        const sellerProfile = original.listing.product.sellerProfile;
        if (
          !sellerProfile.handoffContactType ||
          !sellerProfile.handoffContactValue
        ) {
          throw new ConflictException('Seller handoff contact is missing');
        }

        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            const created = await tx.order.create({
              data: {
                publicId: this.publicIds.generate(),
                listingId: original.listingId,
                sellerId: original.sellerId,
                buyerId: bid.bidderUserId,
                sourceBidId: bid.id,
                finalAmount: bid.amount,
                contactDueAt: new Date(),
                ...createOrderSnapshot({
                  sellerHandoffType: sellerProfile.handoffContactType,
                  sellerHandoffValue: sellerProfile.handoffContactValue,
                  buyerEmailAtClose: buyer.email,
                  handoffInitiator: sellerProfile.handoffInitiator,
                }),
              },
            });

            await this.recordAudit(tx, {
              actorUserId: adminUserId,
              targetType: 'ORDER',
              targetId: original.id,
              oldStatus: 'CANCELLED',
              newStatus: 'REPLACED',
              reason: `Manual replacement selected by admin after ${original.cancellationReason ?? 'cancelled Order'}: originalBid=${original.sourceBidId}; replacementBid=${bid.id}`,
            });

            return created;
          } catch (error) {
            if (
              !(
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === 'P2002'
              )
            ) {
              throw error;
            }
          }
        }

        throw new ConflictException('Could not assign Order number');
      },
    );

    const response = await this.findWithProduct(replacement.publicId);
    if (!response) {
      throw new NotFoundException('Order not found');
    }

    return this.toResponse(response, 'admin');
  }

  private async updateSellerStatus(
    userId: string,
    role: string,
    publicId: string,
    nextStatus: 'CONTACTED' | 'COMPLETED' | 'HANDOFF_FAILED',
    allowedStatuses: Array<'PENDING_CONTACT' | 'CONTACTED'>,
  ) {
    if (role !== 'user') {
      throw new ForbiddenException('Seller action requires a user account');
    }

    const result = await runSerializableTransaction(this.prisma, async (tx) => {
      const order = await tx.order.findUnique({
        where: { publicId },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.sellerId !== userId) {
        throw new ForbiddenException('Order is not owned by seller');
      }

      if (
        !allowedStatuses.includes(
          order.status as 'PENDING_CONTACT' | 'CONTACTED',
        )
      ) {
        throw new ConflictException(
          'Order cannot transition to the requested status',
        );
      }

      const updated = await tx.order.update({
        where: { publicId },
        data: { status: nextStatus },
      });

      await this.recordAudit(tx, {
        actorUserId: userId,
        targetType: 'ORDER',
        targetId: order.id,
        oldStatus: order.status,
        newStatus: nextStatus,
        reason: null,
      });

      return updated;
    });

    const response = await this.findWithProduct(result.publicId);
    if (!response) {
      throw new NotFoundException('Order not found');
    }

    return this.toResponse(response, 'seller');
  }

  private findWithProduct(publicId: string) {
    return this.prisma.order.findUnique({
      where: { publicId },
      select: orderWithProductSelect,
    });
  }

  private resolveAudience(
    userId: string,
    role: string,
    order: Pick<OrderRecord, 'sellerId' | 'buyerId'>,
  ): OrderAudience {
    if (role === 'admin') {
      return 'admin';
    }

    if (order.sellerId === userId) {
      return 'seller';
    }

    if (order.buyerId === userId) {
      return 'buyer';
    }

    throw new ForbiddenException('Order is not available');
  }

  private toResponse(order: NonNullable<OrderRecord>, audience: OrderAudience) {
    if (!order.listing.product.title) {
      throw new InternalServerErrorException(
        'Approved Order product is missing a title',
      );
    }

    const base = {
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
        title: order.listing.product.title,
      },
    };

    if (audience === 'admin') {
      return adminOrderResponseSchema.parse({
        ...base,
        sellerHandoffType: order.sellerHandoffType,
        sellerHandoffValue: order.sellerHandoffValue,
        buyerEmailAtClose: order.buyerEmailAtClose,
        handoffInitiator: order.handoffInitiator,
      });
    }

    if (audience === 'seller') {
      return sellerOrderResponseSchema.parse({
        ...base,
        buyerEmailAtClose: order.buyerEmailAtClose,
      });
    }

    return buyerOrderResponseSchema.parse({
      ...base,
      sellerHandoffType:
        order.handoffInitiator === 'BUYER_CONTACTS_SELLER'
          ? order.sellerHandoffType
          : null,
      sellerHandoffValue:
        order.handoffInitiator === 'BUYER_CONTACTS_SELLER'
          ? order.sellerHandoffValue
          : null,
    });
  }

  private async recordAudit(
    tx: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      targetType: 'ORDER';
      targetId: string;
      oldStatus: string | null;
      newStatus: string | null;
      reason: string | null;
    },
  ) {
    await tx.auditEvent.create({
      data: input,
    });
  }
}
